use crate::{db, db::TableInfo, MainError};
use diesel::SqliteConnection;
use log::info;
use std::io::Write;
use std::sync::{Arc, Mutex};

const METRIC_TABLES: [&str; 5] = [
    "block_stats",
    "tx_stats",
    "script_stats",
    "input_stats",
    "output_stats",
];
const COLUMN_NAMES_THAT_ARENT_METRICS: [&str; 6] =
    ["height", "date", "version", "nonce", "bits", "pool_id"];

// Generates a date.csv file with a single column with the date.
// To be used together with other metric CSV files.
pub fn date_csv(csv_path: &str, connection: Arc<Mutex<SqliteConnection>>) -> Result<(), MainError> {
    let connection = Arc::clone(&connection);
    let mut conn = connection.lock().unwrap();
    info!("Generating date.csv file...");
    let date_column = db::date_column(&mut conn);
    let mut date_file = std::fs::File::create(format!("{}/date.csv", csv_path))?;
    let date_content: String = date_column
        .iter()
        .map(|row| format!("{}\n", row.date))
        .collect();
    date_file.write_all("date\n".as_bytes())?;
    date_file.write_all(date_content.as_bytes())?;
    Ok(())
}

// Generates multiple metric csv files where each metrics has its own file.
// A metric csv file can be used together with the date.csv file and other metric csv files.
pub fn metrics_csv(
    csv_path: &str,
    connection: Arc<Mutex<SqliteConnection>>,
) -> Result<(), MainError> {
    let connection = Arc::clone(&connection);
    let mut conn = connection.lock().unwrap();

    for table in METRIC_TABLES.iter() {
        let columns = db::list_column_names(&mut conn, table)?;

        // filter out columns that aren't metrics and we don't want to create csv files for
        let columns_filtered: Vec<&TableInfo> = columns
            .iter()
            .filter(|col| !COLUMN_NAMES_THAT_ARENT_METRICS.contains(&&col.name[..]))
            .collect();

        for column in columns_filtered.iter().map(|col| col.name.clone()) {
            info!("Generating metrics for '{}' in table '{}'.", column, table);
            let avg_and_sum = db::column_sum_and_avg_by_date(&mut conn, &column, table);

            let mut avg_file = std::fs::File::create(format!("{}/{}_avg.csv", csv_path, column))?;
            let avg_content: String = avg_and_sum
                .iter()
                .map(|aas| format!("{:.4}\n", aas.avg))
                .collect();
            avg_file.write_all(format!("{}_avg\n", column).as_bytes())?;
            avg_file.write_all(avg_content.as_bytes())?;

            let mut sum_file = std::fs::File::create(format!("{}/{}_sum.csv", csv_path, column))?;
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
