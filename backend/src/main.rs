mod db;
mod rest;
mod schema;
mod stats;

use crate::db::TableInfo;
use log::{debug, error, info, warn};
use stats::Stats;
use std::io::Write;
use std::process::exit;
use std::sync::mpsc as std_mpsc;
use std::{error, fmt};
use tokio::sync::mpsc;

const METRIC_TABLES: [&str; 5] = [
    "block_stats",
    "tx_stats",
    "script_stats",
    "input_stats",
    "output_stats",
];
const COLUMN_NAMES_THAT_ARENT_METRICS: [&str; 5] = ["height", "date", "version", "nonce", "bits"];

#[derive(Debug)]
pub enum MainError {
    DB(diesel::result::Error),
    DBConnection(diesel::result::ConnectionError),
    DBMigration(db::MigrationError),
    REST(rest::RestError),
    IBDNotDone,
}

impl fmt::Display for MainError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MainError::DB(e) => write!(f, "Database Error: {:?}", e),
            MainError::DBConnection(e) => write!(f, "Database Connection Error: {}", e),
            MainError::DBMigration(e) => write!(f, "Database Migration Error: {}", e),
            MainError::IBDNotDone => write!(f, "Node is still in IBD"),
            MainError::REST(e) => write!(f, "REST error: {}", e),
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
            MainError::IBDNotDone => None,
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

#[tokio::main]
async fn main() {
    if let Err(e) = collect_statistics().await {
        error!("Could not collect statistics: {}", e);
        exit(1);
    };

    if let Err(e) = write_csv_files() {
        error!("Could not write CSV files to disk: {}", e);
        exit(1);
    };
}

async fn collect_statistics() -> Result<(), MainError> {
    env_logger::init();

    let connection = &mut db::establish_connection()?;
    db::run_pending_migrations(connection)?;

    let db_height: i64 = db::get_db_block_height(connection)?.unwrap_or_default();

    let client = rest::RestClient::new("localhost", 38332);
    let chain_info = match client.chain_info() {
        Ok(chain_info) => chain_info,
        Err(e) => {
            error!("Could load chain information from Bitcoin Core: {}", e); // TODO: host + port
            return Err(MainError::REST(e));
        }
    };

    if chain_info.initialblockdownload {
        error!("The Bitcoin Core node is in initial block download (progress: {:.2}%). Please try again once the IBD is done.", chain_info.verificationprogress*100.0);
        return Err(MainError::IBDNotDone);
    }
    let rest_height = chain_info.blocks;

    let (block_sender, mut block_receiver) = mpsc::channel(1);
    let (stat_sender, stat_receiver) = std_mpsc::sync_channel(1);

    // get-blocks task
    // gets blocks from the Bitcoin Core REST interface and sends them onwards
    // to the `calc-stats` task
    tokio::spawn(async move {
        for height in std::cmp::max(db_height - 10, 0)..std::cmp::max((rest_height - 6) as i64, 0) {
            debug!("getting block height {}", height);
            let block = match client.block_at_height(height as u64) {
                Ok(block) => block,
                Err(e) => {
                    error!("Could not get block at height {}: {}", height, e);
                    return;
                }
            };
            if let Err(_) = block_sender.send((height as i64, block)).await {
                warn!(
                    "during sending block at height {} to stats generator: block receiver dropped",
                    height
                );
                return;
            }
        }
    });

    // calc-stats task
    // calculates the per block stats and sends them onwards to the batch-insert
    // task
    tokio::spawn(async move {
        while let Some((height, block)) = block_receiver.recv().await {
            debug!("calculating stats for block at height {}..", height);

            let stat_sender_clone = stat_sender.clone();
            rayon::spawn(move || {
                let stats = match Stats::from_block_and_height(block, height) {
                    Ok(s) => s,
                    Err(e) => {
                        error!(
                            "Could not generate stat for block at height {}: {}",
                            height, e
                        );
                        exit(1);
                    }
                };
                if let Err(e) = stat_sender_clone.send(stats) {
                    warn!(
                        "during sending stats at height {} to db writer: stats receiver dropped: {}",
                        height, e
                    );
                    return;
                }
            });
        }
    });

    // batch-insert task
    // inserts the block stats in batches
    let mut stat_buffer = Vec::with_capacity(100);
    while let Ok(stat) = stat_receiver.recv() {
        stat_buffer.push(stat);
        if stat_buffer.len() >= 100 {
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

    // once the stat_receiver is closed, insert the remaining buffer
    // contents into the database
    info!(
        "writing a batch of {} block-stats to database for shutdown",
        stat_buffer.len()
    );
    db::insert_stats(connection, &stat_buffer)?;

    Ok(())
}

fn write_csv_files() -> Result<(), MainError> {
    let connection = &mut db::establish_connection()?;

    info!("Generating date.csv file.");
    let date_column = db::date_column(connection);
    let mut date_file = std::fs::File::create("csv/date.csv").unwrap();
    let date_content: String = date_column
        .iter()
        .map(|row| format!("{}\n", row.date))
        .collect();
    date_file.write_all("date\n".as_bytes()).unwrap();
    date_file.write_all(date_content.as_bytes()).unwrap();

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

            let mut avg_file = std::fs::File::create(format!("csv/{}_avg.csv", column)).unwrap();
            let avg_content: String = avg_and_sum
                .iter()
                .map(|aas| format!("{:.4}\n", aas.avg))
                .collect();
            avg_file
                .write_all(format!("{}_avg\n", column).as_bytes())
                .unwrap();
            avg_file.write_all(avg_content.as_bytes()).unwrap();

            let mut sum_file = std::fs::File::create(format!("csv/{}_sum.csv", column)).unwrap();
            let sum_content: String = avg_and_sum
                .iter()
                .map(|aas| format!("{}\n", aas.sum))
                .collect();
            sum_file
                .write_all(format!("{}_sum\n", column).as_bytes())
                .unwrap();
            sum_file.write_all(sum_content.as_bytes()).unwrap();
        }
    }
    Ok(())
}
