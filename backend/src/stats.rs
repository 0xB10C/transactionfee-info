use bitcoincore_rest::bitcoin::{Block, Transaction, Txid};
use chrono::{DateTime, NaiveDateTime, Utc};
use diesel::prelude::*;
use rawtx_rs::{input::InputType, output::OutputType, tx::TxInfo, script::SignatureType};

use std::collections::HashSet;

pub struct Stats {
    pub block: BlockStats,
    pub tx: TxStats,
    pub input: InputStats,
    pub output: OutputStats,
    //feerate: FeerateStats,
    pub script: ScriptStats,
}

impl Stats {
    pub fn from_block_and_height(block: Block, height: i64) -> Stats {
        let naive_timestamp =
            NaiveDateTime::from_timestamp_millis(block.header.time as i64 * 1000).unwrap();
        let datetime: DateTime<Utc> = DateTime::from_utc(naive_timestamp, Utc);
        let date = datetime.format("%Y-%m-%d").to_string();

        // rawtx-rs transaction infos excluding the coinbase transaction
        let mut tx_infos: Vec<TxInfo> = Vec::with_capacity(block.txdata.len());
        for txinfo_result in block.txdata.iter().skip(1).map(TxInfo::new) {
            match txinfo_result {
                Ok(tx_info) => tx_infos.push(tx_info),
                Err(e) => println!("Error parsing transaction in block {}: {:?}", height, e),
            }
        }

        Stats {
            block: BlockStats::from_block_and_height(&block, height, date.clone(), &tx_infos),
            tx: TxStats::from_block_and_height(&block, height, date.clone(), &tx_infos),
            input: InputStats::from_block_and_height(&block, height, date.clone(), &tx_infos),
            output: OutputStats::from_block_and_height(&block, height, date.clone(), &tx_infos),
            script: ScriptStats::from_block_and_height(&block, height, date.clone(), &tx_infos),
        }
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone)]
#[diesel(table_name = crate::schema::block_stats)]
#[diesel(primary_key(height))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct BlockStats {
    pub height: i64,
    pub date: String,

    pub version: i32,
    pub nonce: i32,
    pub bits: i32,

    /// the size of the block in bytes
    pub size: i64,
    /// the size of the block excluding the witness data.
    pub stripped_size: i64,
    /// the virtual size of the block in bytes (ceil(weight / 4.0))
    pub vsize: i64,
    /// the size of the block in bytes
    pub weight: i64,
    /// the block is empty (no tx besides the coinbase tx)
    pub empty: bool,

    /// Coinbase output amounts (sum)
    pub coinbase_output_amount: i64,
    /// Coinbase transactoin weight
    pub coinbase_weight: i64,

    /// number of transactions in the block
    pub transactions: i32,
    /// number of payments in the block
    pub payments: i32,
    /// count of payments made by SegWit spending transactions
    pub payments_segwit_spending_tx: i32,
    /// count of payments made by Taproot spending transactions
    pub payments_taproot_spending_tx: i32,
    /// count of payments where the transaction signals RBF
    pub payments_signaling_explicit_rbf: i32,

    /// number of inputs spent in this block
    pub inputs: i32,
    /// number of outputs created in this block
    pub outputs: i32,
}

impl BlockStats {
    pub fn from_block_and_height(
        block: &Block,
        height: i64,
        date: String,
        tx_infos: &Vec<TxInfo>,
    ) -> BlockStats {
        BlockStats {
            height: height,
            date: date.to_string(),
            version: block.header.version.to_consensus(),
            nonce: block.header.nonce as i32,
            bits: block.header.bits.to_consensus() as i32,

            size: block.size() as i64,
            stripped_size: block.strippedsize() as i64,
            vsize: block.txdata.iter().map(Transaction::vsize).sum::<usize>() as i64,
            weight: block.weight().to_wu() as i64,
            empty: block.txdata.len() == 1,

            coinbase_output_amount: block
                .txdata
                .first()
                .expect("block should have a coinbase tx")
                .output
                .iter()
                .map(|o| o.value)
                .sum::<u64>() as i64,
            coinbase_weight: block
                .txdata
                .first()
                .expect("block should have a coinbase tx")
                .weight()
                .to_wu() as i64,

            transactions: block.txdata.len() as i32,
            payments: tx_infos.iter().map(|ti| ti.payments).sum::<u32>() as i32,
            payments_segwit_spending_tx: tx_infos
                .iter()
                .filter(|ti| ti.is_spending_segwit())
                .map(|ti| ti.payments)
                .sum::<u32>() as i32,
            payments_taproot_spending_tx: tx_infos
                .iter()
                .filter(|ti| ti.is_spending_taproot())
                .map(|ti| ti.payments)
                .sum::<u32>() as i32,
            payments_signaling_explicit_rbf: tx_infos
                .iter()
                .filter(|ti| ti.is_signaling_explicit_rbf_replicability())
                .map(|ti| ti.payments)
                .sum::<u32>() as i32,

            inputs: block.txdata.iter().map(|tx| tx.input.len()).sum::<usize>() as i32,
            outputs: block.txdata.iter().map(|tx| tx.output.len()).sum::<usize>() as i32,
        }
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone)]
#[diesel(table_name = crate::schema::tx_stats)]
#[diesel(primary_key(height))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct TxStats {
    pub height: i64,
    pub date: String,

    // number of version 1 transactions
    pub tx_version_1: i32,
    // number of version 2 transactions
    pub tx_version_2: i32,
    // number of version 3 transactions
    pub tx_version_3: i32,
    // number of transactions with an unknown version (might change once there are proposals to use e.g. version=4)
    pub tx_version_unknown: i32,

    pub tx_output_amount: i64,

    pub tx_spending_segwit: i32,
    pub tx_spending_only_segwit: i32,
    pub tx_spending_only_legacy: i32,
    pub tx_spending_only_taproot: i32,
    pub tx_spending_segwit_and_legacy: i32,
    pub tx_spending_nested_segwit: i32,
    pub tx_spending_native_segwit: i32,
    pub tx_spending_taproot: i32,

    pub tx_bip69_compliant: i32,
    pub tx_signaling_explicit_rbf: i32,

    pub tx_1_input: i32,
    pub tx_1_output: i32,
    pub tx_1_input_1_output: i32,
    pub tx_1_input_2_output: i32,
    pub tx_spending_newly_created_utxos: i32,

    pub tx_timelock_height: i32,
    pub tx_timelock_timestamp: i32,
    pub tx_timelock_not_enforced: i32,
    pub tx_timelock_too_high: i32,
}

impl TxStats {
    pub fn from_block_and_height(
        block: &Block,
        height: i64,
        date: String,
        tx_infos: &Vec<TxInfo>,
    ) -> TxStats {
        let txids_in_this_block: HashSet<Txid> = block.txdata.iter().map(|tx| tx.txid()).collect();

        TxStats {
            height: height,
            date: date.to_string(),

            tx_version_1: block.txdata.iter().filter(|tx| tx.version == 1).count() as i32,
            tx_version_2: block.txdata.iter().filter(|tx| tx.version == 2).count() as i32,
            tx_version_3: block.txdata.iter().filter(|tx| tx.version == 3).count() as i32,
            tx_version_unknown: block.txdata.iter().filter(|tx| tx.version > 3).count() as i32,

            tx_output_amount: tx_infos
                .iter()
                .map(|ti| ti.output_value_sum().to_sat())
                .sum::<u64>() as i64,

            tx_spending_segwit: tx_infos.iter().filter(|ti| ti.is_spending_segwit()).count() as i32,
            tx_spending_only_segwit: tx_infos
                .iter()
                .filter(|ti| ti.is_only_spending_segwit())
                .count() as i32,
            tx_spending_only_legacy: tx_infos
                .iter()
                .filter(|ti| ti.is_only_spending_legacy())
                .count() as i32,
            tx_spending_only_taproot: tx_infos
                .iter()
                .filter(|ti| ti.is_only_spending_taproot())
                .count() as i32,
            tx_spending_nested_segwit: tx_infos
                .iter()
                .filter(|ti| ti.is_spending_nested_segwit())
                .count() as i32,
            tx_spending_native_segwit: tx_infos
                .iter()
                .filter(|ti| ti.is_spending_native_segwit())
                .count() as i32,
            tx_spending_segwit_and_legacy: tx_infos
                .iter()
                .filter(|ti| ti.is_spending_segwit_and_legacy())
                .count() as i32,

            tx_spending_taproot: tx_infos
                .iter()
                .filter(|ti| ti.is_spending_taproot())
                .count() as i32,

            tx_bip69_compliant: tx_infos.iter().filter(|ti| ti.is_bip69_compliant()).count() as i32,
            tx_signaling_explicit_rbf: tx_infos
                .iter()
                .filter(|ti| ti.is_signaling_explicit_rbf_replicability())
                .count() as i32,

            tx_1_input: block.txdata.iter().filter(|tx| tx.input.len() == 1).count() as i32,
            tx_1_output: block
                .txdata
                .iter()
                .filter(|tx| tx.output.len() == 1)
                .count() as i32,
            tx_1_input_1_output: block
                .txdata
                .iter()
                .filter(|tx| tx.input.len() == 1 && tx.output.len() == 1)
                .count() as i32,
            tx_1_input_2_output: block
                .txdata
                .iter()
                .filter(|tx| tx.input.len() == 1 && tx.output.len() == 2)
                .count() as i32,
            tx_spending_newly_created_utxos: block
                .txdata
                .iter()
                .filter(|tx| {
                    tx.input
                        .iter()
                        .any(|i| txids_in_this_block.contains(&i.previous_output.txid))
                })
                .count() as i32,

            tx_timelock_height: block
                .txdata
                .iter()
                .map(|tx| tx.lock_time.is_block_height())
                .count() as i32,
            tx_timelock_timestamp: block
                .txdata
                .iter()
                .map(|tx| tx.lock_time.is_block_time())
                .count() as i32,
            tx_timelock_not_enforced: block
                .txdata
                .iter()
                .map(|tx| tx.lock_time.to_consensus_u32() > 0 && tx.is_lock_time_enabled())
                .count() as i32,
            tx_timelock_too_high: block
                .txdata
                .iter()
                .map(|tx| {
                    tx.lock_time.is_block_height()
                        && tx.lock_time.to_consensus_u32() > height as u32
                })
                .count() as i32,
        }
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone)]
#[diesel(table_name = crate::schema::script_stats)]
#[diesel(primary_key(height))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct ScriptStats {
    height: i64,
    date: String,

    pubkeys: i32,
    pubkeys_compressed: i32,
    pubkeys_uncompressed: i32,
    pubkeys_compressed_inputs: i32,
    pubkeys_uncompressed_inputs: i32,
    pubkeys_compressed_outputs: i32,
    pubkeys_uncompressed_outputs: i32,

    sigs_schnorr: i32,
    sigs_ecdsa: i32,
    sigs_ecdsa_not_strict_der: i32,
    sigs_ecdsa_strict_der: i32,

    sigs_ecdsa_length_less_70byte: i32,
    sigs_ecdsa_length_70byte: i32,
    sigs_ecdsa_length_71byte: i32,
    sigs_ecdsa_length_72byte: i32,
    sigs_ecdsa_length_73byte: i32,
    sigs_ecdsa_length_74byte: i32,

    sigs_ecdsa_low_r: i32,
    sigs_ecdsa_high_r: i32,
    sigs_ecdsa_low_s: i32,
    sigs_ecdsa_high_s: i32,
    sigs_ecdsa_high_rs: i32,
    sigs_ecdsa_low_rs: i32,
    sigs_ecdsa_low_r_high_s: i32,
    sigs_ecdsa_high_r_low_s: i32,

    sigs_sighashes: i32,
    sigs_sighash_all: i32,
    sigs_sighash_none: i32,
    sigs_sighash_single: i32,
    sigs_sighash_all_acp: i32,
    sigs_sighash_none_acp: i32,
    sigs_sighash_single_acp: i32,
}

impl ScriptStats {
    pub fn from_block_and_height(
        block: &Block,
        height: i64,
        date: String,
        tx_infos: &Vec<TxInfo>,
    ) -> ScriptStats {

        ScriptStats {
            height, date,

            pubkeys: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.pubkey_stats.len())
                    .count()
                +
                ti.output_infos.iter().map(|o| o.pubkey_stats.len()).count()
            })
            .sum::<usize>() as i32,
            pubkeys_compressed: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.pubkey_stats.iter().filter(|pks| pks.compressed).count())
                    .count()
                +
                ti.output_infos.iter().map(|o| o.pubkey_stats.iter().filter(|pks| pks.compressed).count()).count()
            })
            .sum::<usize>() as i32,
            pubkeys_uncompressed: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.pubkey_stats.iter().filter(|pks| !pks.compressed).count())
                    .count()
                +
                ti.output_infos.iter().map(|o| o.pubkey_stats.iter().filter(|pks| !pks.compressed).count()).count()
            })
            .sum::<usize>() as i32,
            pubkeys_compressed_inputs: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.pubkey_stats.iter().filter(|pks| pks.compressed).count())
                    .count()
            })
            .sum::<usize>() as i32,
            pubkeys_uncompressed_inputs: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.pubkey_stats.iter().filter(|pks| !pks.compressed).count())
                    .count()
            })
            .sum::<usize>() as i32,
            pubkeys_compressed_outputs: tx_infos
            .iter()
            .map(|ti| {
                ti.output_infos
                    .iter()
                    .map(|o| o.pubkey_stats.iter().filter(|pks| pks.compressed).count())
                    .count()
            })
            .sum::<usize>() as i32,
            pubkeys_uncompressed_outputs: tx_infos
            .iter()
            .map(|ti| {
                ti.output_infos
                    .iter()
                    .map(|o| o.pubkey_stats.iter().filter(|pks| !pks.compressed).count())
                    .count()
            })
            .sum::<usize>() as i32,

            sigs_schnorr: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Schnorr(_))).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_))).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_not_strict_der: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.was_der_encoded).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_strict_der: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && !si.was_der_encoded).count())
                    .count()
            })
            .sum::<usize>() as i32,

            sigs_ecdsa_length_less_70byte: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.length < 70).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_length_70byte: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.length == 70).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_length_71byte: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.length == 71).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_length_72byte: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.length == 72).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_length_73byte: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.length == 73).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_length_74byte: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.length == 74).count())
                    .count()
            })
            .sum::<usize>() as i32,

            sigs_ecdsa_low_r: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.low_r()).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_high_r: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && !si.low_r()).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_low_s: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.low_s()).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_high_s: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && !si.low_s()).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_high_rs: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && !si.low_r() && !si.low_s()).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_low_rs: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.low_r() && si.low_s()).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_low_r_high_s: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && si.low_r() && !si.low_s()).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_ecdsa_high_r_low_s: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| matches!(si.signature, SignatureType::Ecdsa(_)) && !si.low_r() && si.low_s()).count())
                    .count()
            })
            .sum::<usize>() as i32,

            sigs_sighashes: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.len())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_sighash_all: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| si.sig_hash == 0x01).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_sighash_none: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| si.sig_hash == 0x02).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_sighash_single: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| si.sig_hash == 0x03).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_sighash_all_acp: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| si.sig_hash == 0x81).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_sighash_none_acp: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| si.sig_hash == 0x82).count())
                    .count()
            })
            .sum::<usize>() as i32,
            sigs_sighash_single_acp: tx_infos
            .iter()
            .map(|ti| {
                ti.input_infos
                    .iter()
                    .map(|i| i.signature_info.iter().filter(|si| si.sig_hash == 0x83).count())
                    .count()
            })
            .sum::<usize>() as i32,
        }
    }
}


#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone)]
#[diesel(table_name = crate::schema::input_stats)]
#[diesel(primary_key(height))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct InputStats {
    height: i64,
    date: String,

    inputs_spending_legacy: i32,
    inputs_spending_segwit: i32,
    inputs_spending_taproot: i32,
    inputs_spending_nested_segwit: i32,
    inputs_spending_native_segwit: i32,
    inputs_spending_multisig: i32,
    inputs_spending_p2ms_multisig: i32,
    inputs_spending_p2sh_multisig: i32,
    inputs_spending_nested_p2wsh_multisig: i32,
    inputs_spending_p2wsh_multisig: i32,

    inputs_p2pk: i32,
    inputs_p2pkh: i32,
    inputs_nested_p2wpkh: i32,
    inputs_p2wpkh: i32,
    inputs_p2ms: i32,
    inputs_p2sh: i32,
    inputs_nested_p2wsh: i32,
    inputs_p2wsh: i32,
    inputs_coinbase: i32,
    inputs_witness_coinbase: i32,
    inputs_p2tr_keypath: i32,
    inputs_p2tr_scriptpath: i32,
    inputs_unknown: i32,

    inputs_spend_in_same_block: i32,
}

impl InputStats {
    pub fn from_block_and_height(
        block: &Block,
        height: i64,
        date: String,
        tx_infos: &Vec<TxInfo>,
    ) -> InputStats {
        let txids_in_this_block: HashSet<Txid> = block.txdata.iter().map(|tx| tx.txid()).collect();

        InputStats {
            height,
            date,

            inputs_spending_legacy: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.is_spending_legacy())
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_spending_segwit: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.is_spending_segwit())
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_spending_taproot: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.is_spending_taproot())
                        .count()
                })
                .sum::<usize>() as i32,

            inputs_spending_nested_segwit: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.is_spending_nested_segwit())
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_spending_native_segwit: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.is_spending_native_segwit())
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_spending_multisig: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.is_spending_multisig())
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_spending_p2ms_multisig: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.is_spending_multisig() && i.in_type == InputType::P2ms)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_spending_nested_p2wsh_multisig: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.is_spending_multisig() && i.in_type == InputType::P2shP2wsh)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_spending_p2wsh_multisig: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.is_spending_multisig() && i.in_type == InputType::P2wsh)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_spending_p2sh_multisig: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.is_spending_multisig() && i.in_type == InputType::P2sh)
                        .count()
                })
                .sum::<usize>() as i32,

            inputs_p2pk: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::P2pk)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_p2pkh: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::P2pkh)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_nested_p2wpkh: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::P2shP2wpkh)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_p2wpkh: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::P2wpkh)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_p2ms: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::P2ms)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_p2sh: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::P2sh)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_nested_p2wsh: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::P2shP2wsh)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_p2wsh: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::P2wsh)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_coinbase: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::Coinbase)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_witness_coinbase: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::CoinbaseWitness)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_p2tr_keypath: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::P2trkp)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_p2tr_scriptpath: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::P2trsp)
                        .count()
                })
                .sum::<usize>() as i32,
            inputs_unknown: tx_infos
                .iter()
                .map(|ti| {
                    ti.input_infos
                        .iter()
                        .filter(|i| i.in_type == InputType::Unknown)
                        .count()
                })
                .sum::<usize>() as i32,

            inputs_spend_in_same_block: block
                .txdata
                .iter()
                .map(|tx| {
                    tx.input
                        .iter()
                        .filter(|i| txids_in_this_block.contains(&i.previous_output.txid))
                        .count()
                })
                .sum::<usize>() as i32,
        }
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone)]
#[diesel(table_name = crate::schema::output_stats)]
#[diesel(primary_key(height))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct OutputStats {
    height: i64,
    date: String,

    outputs_p2pk: i32,
    outputs_p2pkh: i32,
    outputs_p2wpkh: i32,
    outputs_p2ms: i32,
    outputs_p2sh: i32,
    outputs_p2wsh: i32,
    outputs_opreturn: i32,
    outputs_p2tr: i32,
    outputs_unknown: i32,

    outputs_p2pk_amount: i64,
    outputs_p2pkh_amount: i64,
    outputs_p2wpkh_amount: i64,
    outputs_p2ms_amount: i64,
    outputs_p2sh_amount: i64,
    outputs_p2wsh_amount: i64,
    outputs_p2tr_amount: i64,
    outputs_opreturn_amount: i64,
    outputs_unknown_amount: i64,
}

impl OutputStats {
    pub fn from_block_and_height(
        block: &Block,
        height: i64,
        date: String,
        tx_infos: &Vec<TxInfo>,
    ) -> OutputStats {
        OutputStats {
            height,
            date,

            outputs_p2pk: tx_infos
                .iter()
                .map(|ti| {
                    ti.output_infos
                        .iter()
                        .filter(|o| o.out_type == OutputType::P2pk)
                        .count()
                })
                .sum::<usize>() as i32,
            outputs_p2pkh: tx_infos
                .iter()
                .map(|ti| {
                    ti.output_infos
                        .iter()
                        .filter(|o| o.out_type == OutputType::P2pkh)
                        .count()
                })
                .sum::<usize>() as i32,
            outputs_p2wpkh: tx_infos
                .iter()
                .map(|ti| {
                    ti.output_infos
                        .iter()
                        .filter(|o| o.out_type == OutputType::P2wpkhV0)
                        .count()
                })
                .sum::<usize>() as i32,
            outputs_p2ms: tx_infos
                .iter()
                .map(|ti| {
                    ti.output_infos
                        .iter()
                        .filter(|o| o.out_type == OutputType::P2ms)
                        .count()
                })
                .sum::<usize>() as i32,
            outputs_p2sh: tx_infos
                .iter()
                .map(|ti| {
                    ti.output_infos
                        .iter()
                        .filter(|o| o.out_type == OutputType::P2sh)
                        .count()
                })
                .sum::<usize>() as i32,
            outputs_p2wsh: tx_infos
                .iter()
                .map(|ti| {
                    ti.output_infos
                        .iter()
                        .filter(|o| o.out_type == OutputType::P2wshV0)
                        .count()
                })
                .sum::<usize>() as i32,
            outputs_opreturn: tx_infos
                .iter()
                .map(|ti| ti.output_infos.iter().filter(|o| o.is_opreturn()).count())
                .sum::<usize>() as i32,
            outputs_p2tr: tx_infos
                .iter()
                .map(|ti| {
                    ti.output_infos
                        .iter()
                        .filter(|o| o.out_type == OutputType::P2tr)
                        .count()
                })
                .sum::<usize>() as i32,
            outputs_unknown: tx_infos
                .iter()
                .map(|ti| {
                    ti.output_infos
                        .iter()
                        .filter(|o| o.out_type == OutputType::Unknown)
                        .count()
                })
                .sum::<usize>() as i32,

            outputs_p2pk_amount: tx_infos
                .iter()
                .map(|ti| {
                    {
                        ti.output_infos
                            .iter()
                            .filter(|o| o.out_type == OutputType::P2pk)
                            .map(|o| o.value.to_sat())
                    }
                    .sum::<u64>()
                })
                .sum::<u64>() as i64,
            outputs_p2pkh_amount: tx_infos
                .iter()
                .map(|ti| {
                    {
                        ti.output_infos
                            .iter()
                            .filter(|o| o.out_type == OutputType::P2pkh)
                            .map(|o| o.value.to_sat())
                    }
                    .sum::<u64>()
                })
                .sum::<u64>() as i64,
            outputs_p2wpkh_amount: tx_infos
                .iter()
                .map(|ti| {
                    {
                        ti.output_infos
                            .iter()
                            .filter(|o| o.out_type == OutputType::P2wpkhV0)
                            .map(|o| o.value.to_sat())
                    }
                    .sum::<u64>()
                })
                .sum::<u64>() as i64,
            outputs_p2ms_amount: tx_infos
                .iter()
                .map(|ti| {
                    {
                        ti.output_infos
                            .iter()
                            .filter(|o| o.out_type == OutputType::P2ms)
                            .map(|o| o.value.to_sat())
                    }
                    .sum::<u64>()
                })
                .sum::<u64>() as i64,
            outputs_p2sh_amount: tx_infos
                .iter()
                .map(|ti| {
                    {
                        ti.output_infos
                            .iter()
                            .filter(|o| o.out_type == OutputType::P2sh)
                            .map(|o| o.value.to_sat())
                    }
                    .sum::<u64>()
                })
                .sum::<u64>() as i64,
            outputs_p2wsh_amount: tx_infos
                .iter()
                .map(|ti| {
                    {
                        ti.output_infos
                            .iter()
                            .filter(|o| o.out_type == OutputType::P2wshV0)
                            .map(|o| o.value.to_sat())
                    }
                    .sum::<u64>()
                })
                .sum::<u64>() as i64,
            outputs_p2tr_amount: tx_infos
                .iter()
                .map(|ti| {
                    {
                        ti.output_infos
                            .iter()
                            .filter(|o| o.out_type == OutputType::P2tr)
                            .map(|o| o.value.to_sat())
                    }
                    .sum::<u64>()
                })
                .sum::<u64>() as i64,
            outputs_opreturn_amount: tx_infos
                .iter()
                .map(|ti| {
                    {
                        ti.output_infos
                            .iter()
                            .filter(|o| o.is_opreturn())
                            .map(|o| o.value.to_sat())
                    }
                    .sum::<u64>()
                })
                .sum::<u64>() as i64,
            outputs_unknown_amount: tx_infos
                .iter()
                .map(|ti| {
                    {
                        ti.output_infos
                            .iter()
                            .filter(|o| o.out_type == OutputType::Unknown)
                            .map(|o| o.value.to_sat())
                    }
                    .sum::<u64>()
                })
                .sum::<u64>() as i64,
        }
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone)]
#[diesel(table_name = crate::schema::feerate_stats)]
#[diesel(primary_key(height))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct FeerateStats {
    height: i64,
    date: String,

    fee_min: i64,
    fee_5th_percentile: i64,
    fee_10th_percentile: i64,
    fee_25th_percentile: i64,
    fee_35th_percentile: i64,
    fee_50th_percentile: i64,
    fee_65th_percentile: i64,
    fee_75th_percentile: i64,
    fee_90th_percentile: i64,
    fee_95th_percentile: i64,
    fee_max: i64,
    fee_sum: i64,
    fee_avg: f32,
    size_min: i32,
    size_5th_percentile: i32,
    size_10th_percentile: i32,
    size_25th_percentile: i32,
    size_35th_percentile: i32,
    size_50th_percentile: i32,
    size_65th_percentile: i32,
    size_75th_percentile: i32,
    size_90th_percentile: i32,
    size_95th_percentile: i32,
    size_max: i32,
    size_avg: f32,
    size_sum: i64,
    feerate_min: f32,
    feerate_5th_percentile: f32,
    feerate_10th_percentile: f32,
    feerate_25th_percentile: f32,
    feerate_35th_percentile: f32,
    feerate_50th_percentile: f32,
    feerate_65th_percentile: f32,
    feerate_75th_percentile: f32,
    feerate_90th_percentile: f32,
    feerate_95th_percentile: f32,
    feerate_max: f32,
    feerate_avg: f32,
    feerate_package_min: f32,
    feerate_package_5th_percentile: f32,
    feerate_package_10th_percentile: f32,
    feerate_package_25th_percentile: f32,
    feerate_package_35th_percentile: f32,
    feerate_package_50th_percentile: f32,
    feerate_package_65th_percentile: f32,
    feerate_package_75th_percentile: f32,
    feerate_package_90th_percentile: f32,
    feerate_package_95th_percentile: f32,
    feerate_package_max: f32,
    feerate_package_avg: f32,
}
