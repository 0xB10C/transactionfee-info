mod db;
mod rest;
mod schema;
mod stats;

use stats::Stats;
use std::io::Write;
use std::sync::mpsc as std_mpsc;
use tokio::sync::mpsc;

use crate::db::TableInfo;

const METRIC_TABLES: [&str; 5] = [
    "block_stats",
    "tx_stats",
    "script_stats",
    "input_stats",
    "output_stats",
];
const COLUMN_NAMES_THAT_ARENT_METRICS: [&str; 5] = ["height", "date", "version", "nonce", "bits"];

#[tokio::main]
async fn main() {
    if let Err(e) = collect_statistics().await {
        println!("Could not collect statistics: {}", e);
        return;
    };

    if let Err(e) = write_csv_files() {
        println!("Could not write CSV files to disk: {}", e);
        return;
    };
}

async fn collect_statistics() -> Result<(), diesel::result::Error> {
    let connection = &mut db::establish_connection();
    if let Err(e) = db::run_pending_migrations(connection) {
        panic!("could not run migration {}", e); // TODO
    }
    let client = rest::RestClient::new("localhost", 38332);

    let db_height: i64 = db::get_db_block_height(connection)?.unwrap_or_default();
    let chain_info = match client.chain_info() {
        Ok(chain_info) => chain_info,
        Err(e) => panic!("rest error: {}", e), // TODO:
    };
    if chain_info.initialblockdownload {
        panic!("The Bitcoin Core node is in initial block download (progress: {:.2}%). Please try again once the IBD is done.", chain_info.verificationprogress*100.0);
        // TODO
    }
    let rest_height = chain_info.blocks;

    let (block_sender, mut block_receiver) = mpsc::channel(1);
    let (stat_sender, stat_receiver) = std_mpsc::sync_channel(1);

    tokio::spawn(async move {
        for height in std::cmp::max(db_height - 10, 0)..std::cmp::max((rest_height - 6) as i64, 0) {
            println!("getting block height {}", height);
            let block = client.block_at_height(height as u64).unwrap(); // TODO:
            if let Err(_) = block_sender.send((height as i64, block)).await {
                println!("receiver dropped");
                return;
            }
        }
    });

    tokio::spawn(async move {
        while let Some((height, block)) = block_receiver.recv().await {
            println!("calculating stats..");

            let stat_sender_clone = stat_sender.clone();
            rayon::spawn(move || {
                let stats = Stats::from_block_and_height(block, height);
                if let Err(_) = stat_sender_clone.send(stats) {
                    println!("receiver dropped");
                    return;
                }
            });
        }
    });

    let mut stat_buffer = Vec::with_capacity(100);
    while let Ok(stat) = stat_receiver.recv() {
        stat_buffer.push(stat);
        if stat_buffer.len() >= 100 {
            db::insert_stats(connection, &stat_buffer)?;
            stat_buffer.clear();
        }
    }
    db::insert_stats(connection, &stat_buffer)?;
    stat_buffer.clear();

    Ok(())
}

fn write_csv_files() -> Result<(), diesel::result::Error> {
    let connection = &mut db::establish_connection();

    println!("Generating date.csv file.");
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
            println!("Generating metrics for '{}' in table '{}'.", column, table);
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
