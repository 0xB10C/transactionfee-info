use crate::schema;
use crate::stats::{BlockStats, InputStats, OutputStats, Stats, TxStats};
use diesel::prelude::*;
use diesel::sql_query;
use diesel::sql_types::Text;
use diesel::sqlite::SqliteConnection;

#[derive(Debug, QueryableByName)]
struct TableInfo {
    #[diesel(sql_type = Text)]
    pub name: String,
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

fn list_column_names(conn: &mut SqliteConnection) {
    let columns: Vec<TableInfo> = sql_query("PRAGMA table_info(block_stats)")
        .get_results(conn)
        .unwrap();
    println!("{:?}", columns);
}

pub fn insert_stats(conn: &mut SqliteConnection, stats: &Vec<Stats>) {
    insert_block_stats(conn, &stats.iter().map(|s| s.block.clone()).collect());
    insert_tx_stats(conn, &stats.iter().map(|s| s.tx.clone()).collect());
    insert_input_stats(conn, &stats.iter().map(|s| s.input.clone()).collect());
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