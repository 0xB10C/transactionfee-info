use clap::Parser;
use env_logger::Env;
use log::error;
use std::process::exit;
use transactionfee_info_backend::{collect_statistics, write_csv_files, Args};

const DEFAULT_LOG_LEVEL: &str = "info";

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
