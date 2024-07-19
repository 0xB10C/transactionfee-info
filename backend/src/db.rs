use crate::schema;
use crate::stats::{BlockStats, InputStats, OutputStats, ScriptStats, Stats, TxStats};
use diesel::prelude::*;
use diesel::sql_query;
use diesel::sql_types::{BigInt, Float, Text};
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use std::error::Error;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations/");

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

pub fn run_pending_migrations(
    conn: &mut SqliteConnection,
) -> Result<(), Box<dyn Error + Send + Sync + 'static>> {
    conn.run_pending_migrations(MIGRATIONS)?;
    Ok(())
}

pub fn get_db_block_height(
    conn: &mut SqliteConnection,
) -> Result<Option<i64>, diesel::result::Error> {
    return schema::block_stats::dsl::block_stats
        .select(diesel::dsl::max(schema::block_stats::height))
        .first(conn);
}

pub fn list_column_names(
    conn: &mut SqliteConnection,
    table: &str,
) -> Result<Vec<TableInfo>, diesel::result::Error> {
    sql_query(format!("PRAGMA table_info({})", table)).get_results(conn)
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

pub fn insert_stats(
    conn: &mut SqliteConnection,
    stats: &Vec<Stats>,
) -> Result<(), diesel::result::Error> {
    insert_block_stats(conn, &stats.iter().map(|s| s.block.clone()).collect())?;
    insert_tx_stats(conn, &stats.iter().map(|s| s.tx.clone()).collect())?;
    insert_input_stats(conn, &stats.iter().map(|s| s.input.clone()).collect())?;
    insert_output_stats(conn, &stats.iter().map(|s| s.output.clone()).collect())?;
    insert_script_stats(conn, &stats.iter().map(|s| s.script.clone()).collect())?;
    Ok(())
}

fn insert_block_stats(
    conn: &mut SqliteConnection,
    stats: &Vec<BlockStats>,
) -> Result<(), diesel::result::Error> {
    use crate::schema::block_stats;

    if let Err(e) = diesel::insert_into(block_stats::table)
        .values(stats)
        .execute(conn)
    {
        match e {
            diesel::result::Error::DatabaseError(db_error, _) => {
                match db_error {
                    diesel::result::DatabaseErrorKind::UniqueViolation => {
                        for stat in stats.iter() {
                            // TODO: log
                            diesel::insert_into(block_stats::table)
                                .values(stat)
                                .on_conflict(block_stats::height)
                                .do_update()
                                .set(stat)
                                .execute(conn)?;
                        }
                        return Ok(());
                    }
                    _ => return Err(e),
                }
            }
            _ => return Err(e),
        }
    }
    Ok(())
}

fn insert_tx_stats(
    conn: &mut SqliteConnection,
    stats: &Vec<TxStats>,
) -> Result<(), diesel::result::Error> {
    use crate::schema::tx_stats;

    if let Err(e) = diesel::insert_into(tx_stats::table)
        .values(stats)
        .execute(conn)
    {
        match e {
            diesel::result::Error::DatabaseError(db_error, _) => {
                match db_error {
                    diesel::result::DatabaseErrorKind::UniqueViolation => {
                        for stat in stats.iter() {
                            // TODO: log
                            diesel::insert_into(tx_stats::table)
                                .values(stat)
                                .on_conflict(tx_stats::height)
                                .do_update()
                                .set(stat)
                                .execute(conn)?;
                        }
                        return Ok(());
                    }
                    _ => return Err(e),
                }
            }
            _ => return Err(e),
        }
    }
    Ok(())
}

fn insert_input_stats(
    conn: &mut SqliteConnection,
    stats: &Vec<InputStats>,
) -> Result<(), diesel::result::Error> {
    use crate::schema::input_stats;

    if let Err(e) = diesel::insert_into(input_stats::table)
        .values(stats)
        .execute(conn)
    {
        match e {
            diesel::result::Error::DatabaseError(db_error, _) => {
                match db_error {
                    diesel::result::DatabaseErrorKind::UniqueViolation => {
                        for stat in stats.iter() {
                            // TODO: log
                            diesel::insert_into(input_stats::table)
                                .values(stat)
                                .on_conflict(input_stats::height)
                                .do_update()
                                .set(stat)
                                .execute(conn)?;
                        }
                        return Ok(());
                    }
                    _ => return Err(e),
                }
            }
            _ => return Err(e),
        }
    }
    Ok(())
}

fn insert_output_stats(
    conn: &mut SqliteConnection,
    stats: &Vec<OutputStats>,
) -> Result<(), diesel::result::Error> {
    use crate::schema::output_stats;

    if let Err(e) = diesel::insert_into(output_stats::table)
        .values(stats)
        .execute(conn)
    {
        match e {
            diesel::result::Error::DatabaseError(db_error, _) => {
                match db_error {
                    diesel::result::DatabaseErrorKind::UniqueViolation => {
                        for stat in stats.iter() {
                            // TODO: log
                            diesel::insert_into(output_stats::table)
                                .values(stat)
                                .on_conflict(output_stats::height)
                                .do_update()
                                .set(stat)
                                .execute(conn)?;
                        }
                        return Ok(());
                    }
                    _ => return Err(e),
                }
            }
            _ => return Err(e),
        }
    }
    Ok(())
}

fn insert_script_stats(
    conn: &mut SqliteConnection,
    stats: &Vec<ScriptStats>,
) -> Result<(), diesel::result::Error> {
    use crate::schema::script_stats;

    if let Err(e) = diesel::insert_into(script_stats::table)
        .values(stats)
        .execute(conn)
    {
        match e {
            diesel::result::Error::DatabaseError(db_error, _) => {
                match db_error {
                    diesel::result::DatabaseErrorKind::UniqueViolation => {
                        for stat in stats.iter() {
                            // TODO: log
                            diesel::insert_into(script_stats::table)
                                .values(stat)
                                .on_conflict(script_stats::height)
                                .do_update()
                                .set(stat)
                                .execute(conn)?;
                        }
                        return Ok(());
                    }
                    _ => return Err(e),
                }
            }
            _ => return Err(e),
        }
    }
    Ok(())
}
