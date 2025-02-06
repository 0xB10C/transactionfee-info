mod db;
mod rest;
mod schema;
mod stats;

use crate::db::TableInfo;
use clap::Parser;
use env_logger::Env;
use log::{debug, error, info, warn};
use stats::Stats;
use std::io::Write;
use std::process::exit;
use std::sync::mpsc;
use std::{error, fmt, io, thread};

const METRIC_TABLES: [&str; 5] = [
    "block_stats",
    "tx_stats",
    "script_stats",
    "input_stats",
    "output_stats",
];
const COLUMN_NAMES_THAT_ARENT_METRICS: [&str; 6] =
    ["height", "date", "version", "nonce", "bits", "pool_id"];
const DEFAULT_LOG_LEVEL: &str = "info";
const DATABASE_BATCH_SIZE: usize = 100;

// Don't fetch (and process) the most recent blocks to be safe
// in-case of a reorg.
const REORG_SAFETY_MARGIN: u64 = 6;

#[derive(Debug)]
pub enum MainError {
    DB(diesel::result::Error),
    DBConnection(diesel::result::ConnectionError),
    DBMigration(db::MigrationError),
    REST(rest::RestError),
    Stats(stats::StatsError),
    IBDNotDone,
    IOError(io::Error),
}

impl fmt::Display for MainError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MainError::DB(e) => write!(f, "Database Error: {:?}", e),
            MainError::DBConnection(e) => write!(f, "Database Connection Error: {}", e),
            MainError::DBMigration(e) => write!(f, "Database Migration Error: {}", e),
            MainError::IBDNotDone => write!(f, "Node is still in IBD"),
            MainError::REST(e) => write!(f, "REST error: {}", e),
            MainError::Stats(e) => write!(f, "Stats generation error: {}", e),
            MainError::IOError(e) => write!(f, "IO error: {}", e),
        }
    }
}

impl error::Error for MainError {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match *self {
            MainError::DB(ref e) => Some(e),
            MainError::DBConnection(ref e) => Some(e),
            MainError::DBMigration(ref _e) => None,
            MainError::REST(ref e) => Some(e),
            MainError::Stats(ref e) => Some(e),
            MainError::IBDNotDone => None,
            MainError::IOError(ref e) => Some(e),
        }
    }
}

impl From<diesel::result::Error> for MainError {
    fn from(e: diesel::result::Error) -> Self {
        MainError::DB(e)
    }
}

impl From<diesel::result::ConnectionError> for MainError {
    fn from(e: diesel::result::ConnectionError) -> Self {
        MainError::DBConnection(e)
    }
}

impl From<db::MigrationError> for MainError {
    fn from(e: db::MigrationError) -> Self {
        MainError::DBMigration(e)
    }
}

impl From<rest::RestError> for MainError {
    fn from(e: rest::RestError) -> Self {
        MainError::REST(e)
    }
}

impl From<stats::StatsError> for MainError {
    fn from(e: stats::StatsError) -> Self {
        MainError::Stats(e)
    }
}

impl From<io::Error> for MainError {
    fn from(e: io::Error) -> Self {
        MainError::IOError(e)
    }
}

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Host part of the Bitcoin Core REST API endpoint
    #[arg(long, default_value = "localhost")]
    rest_host: String,

    /// Port part of the Bitcoin Core REST API endpoint
    #[arg(long, default_value_t = 8332)]
    rest_port: u16,

    /// Path to the SQLite database file where the stats are stored
    #[arg(long, default_value = "./db.sqlite")]
    database_path: String,

    /// Path where the CSV files should be written to
    #[arg(long, default_value = "./csv")]
    csv_path: String,

    /// Flag to disable CSV file writing
    #[arg(long, default_value_t = false)]
    no_csv: bool,

    /// Flag to disable stat generation
    #[arg(long, default_value_t = false)]
    no_stats: bool,
}

fn main() {
    env_logger::Builder::from_env(Env::default().default_filter_or(DEFAULT_LOG_LEVEL)).init();

    let args = Args::parse();

    if !args.no_stats {
        if let Err(e) = collect_statistics(&args) {
            error!("Could not collect statistics: {}", e);
            exit(1);
        };
    }

    if !args.no_csv {
        if let Err(e) = write_csv_files(&args) {
            error!("Could not write CSV files to disk: {}", e);
            exit(1);
        };
    }
}

fn collect_statistics(args: &Args) -> Result<(), MainError> {
    let connection = &mut db::establish_connection(&args.database_path)?;
    db::run_pending_migrations(connection)?;

    let db_height: i64 = db::get_db_block_height(connection)?.unwrap_or_default();

    let client = rest::RestClient::new(&args.rest_host, args.rest_port);
    let chain_info = match client.chain_info() {
        Ok(chain_info) => chain_info,
        Err(e) => {
            error!(
                "Could load chain information from Bitcoin Core at {}:{}: {}",
                args.rest_host, args.rest_port, e
            );
            return Err(MainError::REST(e));
        }
    };

    if chain_info.initialblockdownload {
        error!("The Bitcoin Core node is in initial block download (progress: {:.2}%). Please try again once the IBD is done.", chain_info.verificationprogress*100.0);
        return Err(MainError::IBDNotDone);
    }
    let rest_height = chain_info.blocks;

    let (block_sender, block_receiver) = mpsc::sync_channel(10);
    let (stat_sender, stat_receiver) = mpsc::sync_channel(100);

    // get-blocks task
    // gets blocks from the Bitcoin Core REST interface and sends them onwards
    // to the `calc-stats` task
    let get_blocks_task = thread::spawn(move || -> Result<(), MainError> {
        for height in std::cmp::max(db_height + 1, 0)
            ..std::cmp::max((rest_height - REORG_SAFETY_MARGIN) as i64, 0)
        {
            debug!("get-blocks: getting block at height {}", height);
            let block = match client.block_at_height(height as u64) {
                Ok(block) => block,
                Err(e) => {
                    error!("Could not get block at height {}: {}", height, e);
                    return Err(MainError::REST(e));
                }
            };
            if let Err(_) = block_sender.send((height as i64, block)) {
                warn!(
                    "during sending block at height {} to stats generator: block receiver dropped",
                    height
                );
                // We can return OK here. When the receiver is dropped, there
                // probably was an error in the calc-stats task.
                return Ok(());
            }
        }
        Ok(())
    });

    // calc-stats task
    // calculates the per block stats and sends them onwards to the batch-insert
    // task
    let calc_stats_task = thread::spawn(move || -> Result<(), MainError> {
        while let Ok((height, block)) = block_receiver.recv() {
            debug!("calc-stats: processing block at height {}..", height);
            let stat_sender_clone = stat_sender.clone();
            rayon::spawn(move || {
                let stats_result = Stats::from_block_and_height(block, height);
                if let Err(e) = stats_result.clone() {
                    error!(
                        "Could not calculate stats for block at height {}: {}",
                        height, e
                    );
                    // We can't continue here and probably need to fix something
                    // in rawtx_rs..
                    panic!(
                        "Could not process block {}: {}",
                        height,
                        MainError::Stats(e)
                    );
                };
                if let Err(e) = stat_sender_clone.send(stats_result) {
                    // We can't continue here..
                    panic!(
                        "during sending stats at height {} to db writer: stats receiver dropped: {}",
                        height, e
                    );
                } else {
                    debug!(
                        "calc-stats: processed block at height {} (block_receiver is now closed)",
                        height
                    );
                }
            });
        }
        // Reaching this point doesn't mean we're done processing all block just yet
        // We might still be processing some..
        debug!("calc-stats: received all blocks and started processing them..");
        Ok(())
    });

    // batch-insert task
    // inserts the block stats in batches
    let database_path_clone = args.database_path.clone();
    let batch_insert_task = thread::spawn(move || -> Result<(), MainError> {
        let connection = &mut db::establish_connection(&database_path_clone)?;
        db::performance_tune(connection)?;
        let mut stat_buffer = Vec::with_capacity(DATABASE_BATCH_SIZE);

        loop {
            let stat_recv_result = stat_receiver.recv();
            let stat = match stat_recv_result {
                Ok(stat_result) => match stat_result {
                    Ok(stat) => stat,
                    Err(e) => {
                        error!("Could write stat: {}", e);
                        return Err(MainError::Stats(e));
                    }
                },
                Err(e) => {
                    info!("batch-insert: the calc-stats task finished ({})", e);
                    break;
                }
            };

            stat_buffer.push(stat);
            if stat_buffer.len() >= DATABASE_BATCH_SIZE {
                info!(
                    "writing a batch of {} block-stats to database (max height: {})",
                    stat_buffer.len(),
                    stat_buffer
                        .iter()
                        .map(|s| s.block.height)
                        .max()
                        .unwrap_or_default()
                );
                db::insert_stats(connection, &stat_buffer)?;
                stat_buffer.clear();
            }
        }

        if stat_buffer.len() > 0 {
            // once the stat_receiver is closed, insert the remaining buffer
            // contents into the database
            info!(
                "collect-statistics: writing the final batch of {} block-stats to database",
                stat_buffer.len()
            );
            db::insert_stats(connection, &stat_buffer)?;
        } else {
            info!("collect-statistics: no new blocks to insert.");
        }
        info!(
            "collect-statistics: database is at height {} with a reorg-safety margin of {}",
            db_height, REORG_SAFETY_MARGIN,
        );
        Ok(())
    });

    get_blocks_task
        .join()
        .expect("The get-blocks task thread panicked")?;
    calc_stats_task
        .join()
        .expect("The calc-stats task thread panicked")?;
    batch_insert_task
        .join()
        .expect("The batch-insert task thread panicked")?;

    Ok(())
}

fn write_csv_files(args: &Args) -> Result<(), MainError> {
    let connection = &mut db::establish_connection(&args.database_path)?;

    info!("Generating date.csv file.");
    let date_column = db::date_column(connection);
    let mut date_file = std::fs::File::create(format!("{}/date.csv", args.csv_path))?;
    let date_content: String = date_column
        .iter()
        .map(|row| format!("{}\n", row.date))
        .collect();
    date_file.write_all("date\n".as_bytes())?;
    date_file.write_all(date_content.as_bytes())?;

    for table in METRIC_TABLES.iter() {
        let columns = db::list_column_names(connection, table)?;

        // filter out columns that aren't metrics and we don't want to create csv files for
        let columns_filtered: Vec<&TableInfo> = columns
            .iter()
            .filter(|col| !COLUMN_NAMES_THAT_ARENT_METRICS.contains(&&col.name[..]))
            .collect();

        for column in columns_filtered.iter().map(|col| col.name.clone()) {
            info!("Generating metrics for '{}' in table '{}'.", column, table);
            let avg_and_sum = db::column_sum_and_avg_by_date(connection, &column, table);

            let mut avg_file =
                std::fs::File::create(format!("{}/{}_avg.csv", args.csv_path, column))?;
            let avg_content: String = avg_and_sum
                .iter()
                .map(|aas| format!("{:.4}\n", aas.avg))
                .collect();
            avg_file.write_all(format!("{}_avg\n", column).as_bytes())?;
            avg_file.write_all(avg_content.as_bytes())?;

            let mut sum_file =
                std::fs::File::create(format!("{}/{}_sum.csv", args.csv_path, column))?;
            let sum_content: String = avg_and_sum
                .iter()
                .map(|aas| format!("{}\n", aas.sum))
                .collect();
            sum_file.write_all(format!("{}_sum\n", column).as_bytes())?;
            sum_file.write_all(sum_content.as_bytes())?;
        }
    }
    Ok(())
}
