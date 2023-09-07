pub mod db;
pub mod schema;
pub mod stats;

use bitcoincore_rest::{bitcoin::Network, RestApi, RestClient};
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
    collect_statistics().await;
    write_csv_files();
}

async fn collect_statistics() {
    let connection = &mut db::establish_connection();
    let rest = RestClient::network_default(Network::Signet);

    let db_height: i64 = db::get_db_block_height(connection)
        .unwrap()
        .unwrap_or_default(); // TODO: abc
    let chain_info = match rest.get_chain_info().await {
        Ok(chain_info) => chain_info,
        Err(e) => panic!("rest error"), // TODO
    };
    let rest_height = chain_info.blocks;

    if chain_info.initial_block_download {
        panic!("The Bitcoin Core node is in initial block download (progress: {:.2}%). Please try again once the IBD is done.", chain_info.verification_progress*100.0);
        // TODO
    }

    let (block_sender, mut block_receiver) = mpsc::channel(12);
    let (stat_sender, stat_receiver) = std_mpsc::sync_channel(100);

    tokio::spawn(async move {
        for height in std::cmp::max(db_height - 10, 0)..std::cmp::max((rest_height - 6) as i64, 0) {
            println!("getting block height {}", height);
            let block = rest.get_block_at_height(height as u64).await;
            if let Err(_) = block_sender.send((height as i64, block)).await {
                println!("receiver dropped");
                return;
            }
        }
    });

    tokio::spawn(async move {
        while let Some((height, block_result)) = block_receiver.recv().await {
            let block = block_result.expect("block"); // TODO:
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
            db::insert_stats(connection, &stat_buffer);
            stat_buffer.clear();
        }
    }
    db::insert_stats(connection, &stat_buffer);
    stat_buffer.clear();
}

fn write_csv_files() {
    let connection = &mut db::establish_connection();

    println!("Generating date.csv file.");
    let date_column = db::date_column(connection);
    let mut date_file = std::fs::File::create("csv/date.csv").unwrap();
    let date_content: String = date_column
        .iter()
        .map(|row| format!("{}\n", row.date))
        .collect();
    date_file.write_all(date_content.as_bytes()).unwrap();

    for table in METRIC_TABLES.iter() {
        let columns = db::list_column_names(connection, table);

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
            avg_file.write_all(avg_content.as_bytes()).unwrap();

            let mut sum_file = std::fs::File::create(format!("csv/{}_sum.csv", column)).unwrap();
            let sum_content: String = avg_and_sum
                .iter()
                .map(|aas| format!("{}\n", aas.sum))
                .collect();
            sum_file.write_all(sum_content.as_bytes()).unwrap();
        }
    }
}
