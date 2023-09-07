use crate::schema;
use crate::stats::{BlockStats, InputStats, OutputStats, ScriptStats, Stats, TxStats};
use diesel::prelude::*;
use diesel::sql_query;
use diesel::sql_types::{BigInt, Float, Text};
use diesel::sqlite::SqliteConnection;

#[derive(Debug, QueryableByName)]
pub struct TableInfo {
    #[diesel(sql_type = Text)]
    pub name: String,
}

#[derive(Debug, QueryableByName)]
pub struct AvgAndSum {
    #[diesel(sql_type = Float)]
    pub avg: f32,
    #[diesel(sql_type = BigInt)]
    pub sum: i64,
}

#[derive(Debug, QueryableByName)]
pub struct DateColumn {
    #[diesel(sql_type = Text)]
    pub date: String,
}

pub fn establish_connection() -> SqliteConnection {
    let database_url = "db.sqlite";
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}

pub fn get_db_block_height(
    conn: &mut SqliteConnection,
) -> Result<Option<i64>, diesel::result::Error> {
    return schema::block_stats::dsl::block_stats
        .select(diesel::dsl::max(schema::block_stats::height))
        .first(conn);
}

pub fn list_column_names(conn: &mut SqliteConnection, table: &str) -> Vec<TableInfo> {
    let columns: Vec<TableInfo> = sql_query(format!("PRAGMA table_info({})", table))
        .get_results(conn)
        .unwrap();
    return columns;
}

pub fn column_sum_and_avg_by_date(
    conn: &mut SqliteConnection,
    colname: &str,
    table: &str,
) -> Vec<AvgAndSum> {
    sql_query(format!(
        "SELECT avg({}) as avg, sum({}) as sum FROM {} GROUP BY date",
        colname, colname, table
    ))
    .get_results(conn)
    .unwrap()
}

pub fn date_column(conn: &mut SqliteConnection) -> Vec<DateColumn> {
    sql_query(format!(
        "SELECT date as date FROM block_stats GROUP BY date"
    ))
    .get_results(conn)
    .unwrap()
}

pub fn insert_stats(conn: &mut SqliteConnection, stats: &Vec<Stats>) {
    insert_block_stats(conn, &stats.iter().map(|s| s.block.clone()).collect());
    insert_tx_stats(conn, &stats.iter().map(|s| s.tx.clone()).collect());
    insert_input_stats(conn, &stats.iter().map(|s| s.input.clone()).collect());
    insert_output_stats(conn, &stats.iter().map(|s| s.output.clone()).collect());
    insert_script_stats(conn, &stats.iter().map(|s| s.script.clone()).collect());
}

fn insert_block_stats(conn: &mut SqliteConnection, stats: &Vec<BlockStats>) {
    use crate::schema::block_stats;

    if let Err(e) = diesel::insert_into(block_stats::table)
        .values(stats)
        .execute(conn)
    {
        println!("Falling back to upserts..#######################################");
        for stat in stats.iter() {
            // TODO: log
            diesel::insert_into(block_stats::table)
                .values(stat)
                .on_conflict(block_stats::height)
                .do_update()
                .set(stat)
                .execute(conn)
                .unwrap(); // TODO:
        }
    }
}

fn insert_tx_stats(conn: &mut SqliteConnection, stats: &Vec<TxStats>) {
    use crate::schema::tx_stats;

    if let Err(e) = diesel::insert_into(tx_stats::table)
        .values(stats)
        .execute(conn)
    {
        println!("Falling back to upserts..#######################################");
        for stat in stats.iter() {
            // TODO: log
            diesel::insert_into(tx_stats::table)
                .values(stat)
                .on_conflict(tx_stats::height)
                .do_update()
                .set(stat)
                .execute(conn)
                .unwrap(); // TODO:
        }
    }
}

fn insert_input_stats(conn: &mut SqliteConnection, stats: &Vec<InputStats>) {
    use crate::schema::input_stats;

    if let Err(e) = diesel::insert_into(input_stats::table)
        .values(stats)
        .execute(conn)
    {
        println!("Falling back to upserts..#######################################");
        for stat in stats.iter() {
            // TODO: log
            diesel::insert_into(input_stats::table)
                .values(stat)
                .on_conflict(input_stats::height)
                .do_update()
                .set(stat)
                .execute(conn)
                .unwrap(); // TODO:
        }
    }
}

fn insert_output_stats(conn: &mut SqliteConnection, stats: &Vec<OutputStats>) {
    use crate::schema::output_stats;

    if let Err(e) = diesel::insert_into(output_stats::table)
        .values(stats)
        .execute(conn)
    {
        println!("Falling back to upserts..#######################################");
        for stat in stats.iter() {
            // TODO: log
            diesel::insert_into(output_stats::table)
                .values(stat)
                .on_conflict(output_stats::height)
                .do_update()
                .set(stat)
                .execute(conn)
                .unwrap(); // TODO:
        }
    }
}

fn insert_script_stats(conn: &mut SqliteConnection, stats: &Vec<ScriptStats>) {
    use crate::schema::script_stats;

    if let Err(e) = diesel::insert_into(script_stats::table)
        .values(stats)
        .execute(conn)
    {
        println!("Falling back to upserts..#######################################");
        for stat in stats.iter() {
            // TODO: log
            diesel::insert_into(script_stats::table)
                .values(stat)
                .on_conflict(script_stats::height)
                .do_update()
                .set(stat)
                .execute(conn)
                .unwrap(); // TODO:
        }
    }
}
