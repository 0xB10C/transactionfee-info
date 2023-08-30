pub mod db;
pub mod schema;
pub mod stats;

use bitcoincore_rest::{bitcoin::Network, RestApi, RestClient};
use stats::Stats;
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    //list_column_names(connection);

    collect_statistics().await;
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
    let (stat_sender, mut stat_receiver) = mpsc::channel(100);

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
            let stats = Stats::from_block_and_height(block, height);
            if let Err(_) = stat_sender.send(stats).await {
                println!("receiver dropped");
                return;
            }
        }
    });

    let mut stat_buffer = Vec::with_capacity(100);
    while let Some(stat) = stat_receiver.recv().await {
        stat_buffer.push(stat);
        if stat_buffer.len() >= 100 {
            println!("writing to db.......................");
            db::insert_stats(connection, &stat_buffer);
            stat_buffer.clear();
            println!("written to db.........................");
        }
    }
    db::insert_stats(connection, &stat_buffer);
    stat_buffer.clear();
}

async fn write_csv_files() {}
