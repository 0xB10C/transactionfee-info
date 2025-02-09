use bitcoin::{Network, Transaction, Txid};
use bitcoin_pool_identification::{default_data, Pool, PoolIdentification};
use chrono::DateTime;
use diesel::prelude::*;
use log::{debug, error};
use rawtx_rs::{input::InputType, output::OutputType, script::SignatureType, tx::TxInfo};
use std::{collections::HashSet, error, fmt, num::ParseIntError};

use crate::rest::{Block, InputData, ScriptPubkeyType};

const UNKNOWN_POOL_ID: i32 = 0;

#[derive(Debug)]
pub enum StatsError {
    TxInfoError(rawtx_rs::tx::TxInfoError),
    BitcoinEncodeError(bitcoin::consensus::encode::Error),
    ParseIntError(ParseIntError),
}

impl fmt::Display for StatsError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            StatsError::TxInfoError(e) => write!(f, "Bitcoin Script Error: {:?}", e),
            StatsError::BitcoinEncodeError(e) => write!(f, "Bitcoin Encode Error: {:?}", e),
            StatsError::ParseIntError(e) => write!(f, "Parse Int Error: {:?}", e),
        }
    }
}

impl error::Error for StatsError {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match *self {
            StatsError::TxInfoError(ref e) => Some(e),
            StatsError::BitcoinEncodeError(ref e) => Some(e),
            StatsError::ParseIntError(ref e) => Some(e),
        }
    }
}

impl From<rawtx_rs::tx::TxInfoError> for StatsError {
    fn from(e: rawtx_rs::tx::TxInfoError) -> Self {
        StatsError::TxInfoError(e)
    }
}

impl From<bitcoin::consensus::encode::Error> for StatsError {
    fn from(e: bitcoin::consensus::encode::Error) -> Self {
        StatsError::BitcoinEncodeError(e)
    }
}

impl From<ParseIntError> for StatsError {
    fn from(e: ParseIntError) -> Self {
        StatsError::ParseIntError(e)
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Stats {
    pub block: BlockStats,
    pub tx: TxStats,
    pub input: InputStats,
    pub output: OutputStats,
    //feerate: FeerateStats,
    pub script: ScriptStats,
}

impl Stats {
    pub fn from_block(block: Block) -> Result<Stats, StatsError> {
        let timestamp =
            DateTime::from_timestamp(block.time as i64, 0).expect("invalid block header timestamp");
        let date = timestamp.format("%Y-%m-%d").to_string();
        let mut tx_infos: Vec<TxInfo> = Vec::with_capacity(block.txdata.len());
        for tx in block.txdata.iter() {
            let tx: Transaction = bitcoin::consensus::deserialize(&tx.raw)?;
            match TxInfo::new(&tx) {
                Ok(txinfo) => tx_infos.push(txinfo),
                Err(e) => {
                    error!(
                        "Could not create TxInfo for {} in block {}: {}",
                        tx.compute_txid(),
                        block.height,
                        e
                    );
                    return Err(StatsError::TxInfoError(e));
                }
            }
        }

        // TODO: if we ever wanted to generate stats on a network other than
        // mainnet and do pool identification, we'd need to be able to change
        // the network here.
        let pools = default_data(Network::Bitcoin);

        Ok(Stats {
            block: BlockStats::from_block(&block, date.clone(), &tx_infos, &pools)?,
            tx: TxStats::from_block(&block, date.clone(), &tx_infos),
            input: InputStats::from_block(&block, date.clone(), &tx_infos),
            output: OutputStats::from_block(&block, date.clone(), &tx_infos),
            script: ScriptStats::from_block(&block, date.clone(), &tx_infos),
        })
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Debug, PartialEq)]
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
    /// the pool id, if the pool could be identified. If the pool is unknown,
    /// the id will be 0. See the IDs in https://github.com/bitcoin-data/mining-pools/blob/generated/pool-list.json
    pub pool_id: i32,
}

impl BlockStats {
    pub fn from_block(
        block: &Block,
        date: String,
        tx_infos: &Vec<TxInfo>,
        pools: &[Pool],
    ) -> Result<BlockStats, StatsError> {
        let height = block.height;
        let coinbase_tx: Transaction = bitcoin::consensus::deserialize(
            &block
                .txdata
                .first()
                .expect("block should have a coinbase tx")
                .raw,
        )?;
        let pool_id: i32 = match coinbase_tx.identify_pool(Network::Bitcoin, &pools) {
            Some(result) => {
                debug!(
                    "Identified pool '{}' at height {} with method '{:?}'",
                    result.pool.name, height, result.identification_method
                );
                result.pool.id as i32
            }
            None => {
                debug!("Could not identify pool at height {}", height);
                UNKNOWN_POOL_ID
            }
        };

        Ok(BlockStats {
            height: height,
            date: date.to_string(),
            version: block.version.to_consensus(),
            nonce: block.nonce as i32,
            bits: i32::from_str_radix(&block.bits, 16)?,

            pool_id,

            size: block.size,
            stripped_size: block.stripped_size,
            vsize: block.txdata.iter().map(|x| x.vsize).sum::<u32>() as i64,
            weight: block.weight.to_wu() as i64,
            empty: block.txdata.len() == 1,

            coinbase_output_amount: block
                .txdata
                .first()
                .expect("block should have a coinbase tx")
                .output
                .iter()
                .map(|o| o.value.to_sat())
                .sum::<u64>() as i64,
            coinbase_weight: block
                .txdata
                .first()
                .expect("block should have a coinbase tx")
                .weight
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
        })
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Default, Debug, PartialEq)]
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
    pub fn from_block(block: &Block, date: String, tx_infos: &Vec<TxInfo>) -> TxStats {
        let height = block.height;
        let mut s = TxStats::default();

        let txids_in_this_block: HashSet<Txid> = block.txdata.iter().map(|tx| tx.txid).collect();

        s.height = height;
        s.date = date;

        for (tx, tx_info) in block.txdata.iter().zip(tx_infos.iter()) {
            match tx.version.0 {
                1 => s.tx_version_1 += 1,
                2 => s.tx_version_2 += 1,
                3 => s.tx_version_3 += 1,
                _ => s.tx_version_unknown += 1,
            }

            s.tx_output_amount += tx_info.output_value_sum().to_sat() as i64;

            if tx_info.is_spending_segwit() {
                s.tx_spending_segwit += 1;
                if tx_info.is_spending_native_segwit() {
                    s.tx_spending_native_segwit += 1;
                }
                if tx_info.is_spending_nested_segwit() {
                    s.tx_spending_nested_segwit += 1;
                }
                if tx_info.is_spending_taproot() {
                    s.tx_spending_taproot += 1;
                }
            }

            if tx_info.is_spending_segwit_and_legacy() {
                s.tx_spending_segwit_and_legacy += 1;
            }

            if tx_info.is_only_spending_legacy() {
                s.tx_spending_only_legacy += 1;
            } else if tx_info.is_only_spending_segwit() {
                s.tx_spending_only_segwit += 1;
                if tx_info.is_only_spending_taproot() {
                    s.tx_spending_only_taproot += 1;
                }
            }

            if tx_info.is_bip69_compliant() {
                s.tx_bip69_compliant += 1;
            }

            if tx_info.is_signaling_explicit_rbf_replicability() {
                s.tx_signaling_explicit_rbf += 1;
            }

            if tx.input.len() == 1 {
                s.tx_1_input += 1;
                match tx.output.len() {
                    1 => s.tx_1_input_1_output += 1,
                    2 => s.tx_1_input_2_output += 1,
                    _ => (),
                }
            }
            if tx.output.len() == 1 {
                s.tx_1_output += 1;
            }

            if tx.input.iter().any(|i| {
                if let InputData::NonCoinbase { txid, .. } = &i.data {
                    return txids_in_this_block.contains(txid);
                }
                false
            }) {
                s.tx_spending_newly_created_utxos += 1;
            }

            if tx.lock_time.is_block_height() && tx.lock_time.to_consensus_u32() > 0 {
                s.tx_timelock_height += 1;
            } else if tx.lock_time.is_block_time() {
                s.tx_timelock_timestamp += 1;
            }

            if tx.lock_time.to_consensus_u32() > 0 && tx.is_lock_time_enabled() {
                s.tx_timelock_not_enforced += 1;
            }

            if tx.lock_time.is_block_height() && tx.lock_time.to_consensus_u32() > height as u32 {
                s.tx_timelock_too_high += 1;
            }
        }

        return s;
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Default, Debug, PartialEq)]
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
    sigs_ecdsa_length_75byte_or_more: i32,

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
    pub fn from_block(block: &Block, date: String, tx_infos: &Vec<TxInfo>) -> ScriptStats {
        let height = block.height;
        let mut s = ScriptStats::default();

        s.height = height;
        s.date = date;

        for (_, tx_info) in block.txdata.iter().zip(tx_infos.iter()) {
            for input in tx_info.input_infos.iter() {
                // pubkey stats
                for pubkey in input.pubkey_stats.iter() {
                    s.pubkeys += 1;
                    if pubkey.compressed {
                        s.pubkeys_compressed += 1;
                        s.pubkeys_compressed_inputs += 1;
                    } else {
                        s.pubkeys_uncompressed += 1;
                        s.pubkeys_uncompressed_inputs += 1;
                    }
                }

                // signature stats
                for sig in input.signature_info.iter() {
                    if matches!(sig.signature, SignatureType::Schnorr(_)) {
                        s.sigs_schnorr += 1;
                    } else if matches!(sig.signature, SignatureType::Ecdsa(_)) {
                        s.sigs_ecdsa += 1;
                        if sig.was_der_encoded {
                            s.sigs_ecdsa_strict_der += 1;
                        } else {
                            s.sigs_ecdsa_not_strict_der += 1;
                        }
                        match sig.length {
                            8..=69 => s.sigs_ecdsa_length_less_70byte += 1,
                            70 => s.sigs_ecdsa_length_70byte += 1,
                            71 => s.sigs_ecdsa_length_71byte += 1,
                            72 => s.sigs_ecdsa_length_72byte += 1,
                            73 => s.sigs_ecdsa_length_73byte += 1,
                            74 => s.sigs_ecdsa_length_74byte += 1,
                            75.. => s.sigs_ecdsa_length_75byte_or_more += 1,
                            _ => panic!("ECDSA signature with {} bytes..?", sig.length),
                        }

                        let is_r_low = sig.low_r();
                        let is_s_low = sig.low_s();

                        if is_r_low {
                            s.sigs_ecdsa_low_r += 1;
                        } else {
                            s.sigs_ecdsa_high_r += 1;
                        }

                        if is_s_low {
                            s.sigs_ecdsa_low_s += 1;
                        } else {
                            s.sigs_ecdsa_high_s += 1;
                        }

                        if is_r_low && is_s_low {
                            s.sigs_ecdsa_low_rs += 1;
                        } else if !is_r_low && !is_s_low {
                            s.sigs_ecdsa_high_rs += 1;
                        } else if is_r_low && !is_s_low {
                            s.sigs_ecdsa_low_r_high_s += 1;
                        } else if !is_r_low && is_s_low {
                            s.sigs_ecdsa_high_r_low_s += 1;
                        }

                        s.sigs_sighashes += 1;
                        match sig.sig_hash {
                            0x01 => s.sigs_sighash_all += 1,
                            0x02 => s.sigs_sighash_none += 1,
                            0x03 => s.sigs_sighash_single += 1,
                            0x81 => s.sigs_sighash_all_acp += 1,
                            0x82 => s.sigs_sighash_none_acp += 1,
                            0x83 => s.sigs_sighash_single_acp += 1,
                            _ => (),
                        }
                    }
                }
            }

            for output in tx_info.output_infos.iter() {
                // pubkey stats
                for pubkey in output.pubkey_stats.iter() {
                    s.pubkeys += 1;
                    if pubkey.compressed {
                        s.pubkeys_compressed += 1;
                        s.pubkeys_compressed_outputs += 1;
                    } else {
                        s.pubkeys_uncompressed += 1;
                        s.pubkeys_uncompressed_outputs += 1;
                    }
                }
            }
        }
        s
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Default, Debug, PartialEq)]
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
    inputs_p2a: i32,
    inputs_unknown: i32,

    inputs_spend_in_same_block: i32,
}

impl InputStats {
    pub fn from_block(block: &Block, date: String, tx_infos: &Vec<TxInfo>) -> InputStats {
        let height = block.height;
        let txids_in_this_block: HashSet<Txid> = block.txdata.iter().map(|tx| tx.txid).collect();

        let mut s = InputStats::default();
        s.height = height;
        s.date = date;

        for (tx, tx_info) in block.txdata.iter().zip(tx_infos.iter()) {
            for input in tx_info.input_infos.iter() {
                if input.is_spending_legacy() {
                    s.inputs_spending_legacy += 1;
                }
                if input.is_spending_segwit() {
                    s.inputs_spending_segwit += 1;
                }
                if input.is_spending_taproot() {
                    s.inputs_spending_taproot += 1;
                }
                if input.is_spending_nested_segwit() {
                    s.inputs_spending_nested_segwit += 1;
                }
                if input.is_spending_native_segwit() {
                    s.inputs_spending_native_segwit += 1;
                }
                if input.is_spending_multisig() {
                    s.inputs_spending_multisig += 1;
                    match input.in_type {
                        InputType::P2ms => s.inputs_spending_p2ms_multisig += 1,
                        InputType::P2shP2wsh => s.inputs_spending_nested_p2wsh_multisig += 1,
                        InputType::P2wsh => s.inputs_spending_p2wsh_multisig += 1,
                        InputType::P2sh => s.inputs_spending_p2sh_multisig += 1,
                        _ => (),
                    }
                }

                match input.in_type {
                    InputType::P2pk | InputType::P2pkLaxDer => s.inputs_p2pk += 1,
                    InputType::P2pkh | InputType::P2pkhLaxDer => s.inputs_p2pkh += 1,
                    InputType::P2shP2wpkh => s.inputs_nested_p2wpkh += 1,
                    InputType::P2wpkh => s.inputs_p2wpkh += 1,
                    InputType::P2ms | InputType::P2msLaxDer => s.inputs_p2ms += 1,
                    InputType::P2sh => s.inputs_p2sh += 1,
                    InputType::P2shP2wsh => s.inputs_nested_p2wsh += 1,
                    InputType::P2wsh => s.inputs_p2wsh += 1,
                    InputType::Coinbase => s.inputs_coinbase += 1,
                    InputType::CoinbaseWitness => s.inputs_witness_coinbase += 1,
                    InputType::P2trkp => s.inputs_p2tr_keypath += 1,
                    InputType::P2trsp => s.inputs_p2tr_scriptpath += 1,
                    InputType::Unknown | InputType::P2a => s.inputs_unknown += 1,
                }
            }
            for input in tx.input.iter() {
                let InputData::NonCoinbase { txid, prevout, .. } = &input.data else {
                    continue;
                };
                if txids_in_this_block.contains(txid) {
                    s.inputs_spend_in_same_block += 1;
                }

                if matches!(prevout.script_pub_key.type_, ScriptPubkeyType::Anchor) {
                    s.inputs_p2a += 1;
                    s.inputs_unknown -= 1;
                }
            }
        }
        s
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Default, Debug, PartialEq)]
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
    outputs_p2a: i32,
    outputs_unknown: i32,

    outputs_p2pk_amount: i64,
    outputs_p2pkh_amount: i64,
    outputs_p2wpkh_amount: i64,
    outputs_p2ms_amount: i64,
    outputs_p2sh_amount: i64,
    outputs_p2wsh_amount: i64,
    outputs_p2tr_amount: i64,
    outputs_p2a_amount: i64,
    outputs_opreturn_amount: i64,
    outputs_unknown_amount: i64,
}

impl OutputStats {
    pub fn from_block(block: &Block, date: String, tx_infos: &Vec<TxInfo>) -> OutputStats {
        let height = block.height;
        let mut s = OutputStats::default();

        s.height = height;
        s.date = date;

        for (_, tx_info) in block.txdata.iter().zip(tx_infos.iter()) {
            for output in tx_info.output_infos.iter() {
                match output.out_type {
                    OutputType::P2pk => {
                        s.outputs_p2pk += 1;
                        s.outputs_p2pk_amount += output.value.to_sat() as i64;
                    }
                    OutputType::P2pkh => {
                        s.outputs_p2pkh += 1;
                        s.outputs_p2pkh_amount += output.value.to_sat() as i64;
                    }
                    OutputType::P2wpkhV0 => {
                        s.outputs_p2wpkh += 1;
                        s.outputs_p2wpkh_amount += output.value.to_sat() as i64;
                    }
                    OutputType::P2ms => {
                        s.outputs_p2ms += 1;
                        s.outputs_p2ms_amount += output.value.to_sat() as i64;
                    }
                    OutputType::P2sh => {
                        s.outputs_p2sh += 1;
                        s.outputs_p2sh_amount += output.value.to_sat() as i64;
                    }
                    OutputType::P2wshV0 => {
                        s.outputs_p2wsh += 1;
                        s.outputs_p2wsh_amount += output.value.to_sat() as i64;
                    }
                    OutputType::P2tr => {
                        s.outputs_p2tr += 1;
                        s.outputs_p2tr_amount += output.value.to_sat() as i64;
                    }
                    OutputType::P2a => {
                        s.outputs_p2a += 1;
                        s.outputs_p2a_amount += output.value.to_sat() as i64;
                    }
                    OutputType::OpReturn(_) => {
                        s.outputs_opreturn += 1;
                        s.outputs_opreturn_amount += output.value.to_sat() as i64;
                    }
                    OutputType::Unknown => {
                        s.outputs_unknown += 1;
                        s.outputs_unknown_amount += output.value.to_sat() as i64;
                    }
                }
            }
        }
        s
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Debug, PartialEq)]
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

#[cfg(test)]
mod tests {
    use crate::rest::Block;
    use crate::stats::{BlockStats, InputStats, OutputStats, ScriptStats, TxStats};
    use crate::Stats;
    use serde::Deserialize;
    use std::fs::File;
    use std::io::BufReader;

    // helper to make diffs in large Stats structs better visible
    fn diff_stats(got: &Stats, expected: &Stats) {
        let got_str = format!("{:#?}", got);
        let expected_str = format!("{:#?}", expected);
        assert_eq!(got_str.lines().count(), expected_str.lines().count());
        for (got_line, expected_line) in got_str.lines().zip(expected_str.lines()) {
            if got_line != expected_line {
                println!("Mismatch ⚠️");
                println!("Got:      {}", got_line);
                println!("Expected: {}", expected_line);
            }
        }
    }

    // TODO: additional test cases for blocks with taproot transactions
    // and P2A in & outputs

    #[test]
    fn test_block_739990() {
        let buffer = BufReader::new(File::open("./testdata/739990.json").unwrap());
        let mut de = serde_json::Deserializer::from_reader(buffer);
        let block = Block::deserialize(&mut de).expect("test block json to be valid");
        let stats = Stats::from_block(block).expect("testdata blocks should not error");

        let expected_stats = Stats {
            block: BlockStats {
                height: 739990,
                date: "2022-06-09".to_string(),
                version: 0x20000000,
                nonce: 0x33ca7510,
                bits: 0x17094b6a,
                size: 536844,
                stripped_size: 225535,
                vsize: 303595,
                weight: 1213449,
                empty: false,
                coinbase_output_amount: 626983001,
                coinbase_weight: 1272,
                transactions: 645,
                payments: 1882,
                payments_segwit_spending_tx: 1720,
                payments_taproot_spending_tx: 2,
                payments_signaling_explicit_rbf: 457,
                inputs: 2170,
                outputs: 1882,
                // This block was mined by Binance Pool which has the ID 123
                // https://github.com/bitcoin-data/mining-pools/blob/7eb988330043456189ba6d01fd32811a1f234f2a/pool-list.json#L1330C11-L1330C14
                pool_id: 123,
            },
            tx: TxStats {
                height: 739990,
                date: "2022-06-09".to_string(),
                tx_version_1: 271,
                tx_version_2: 374,
                tx_version_3: 0,
                tx_version_unknown: 0,
                tx_output_amount: 125054585129,
                tx_spending_segwit: 562,
                tx_spending_only_segwit: 553,
                tx_spending_only_legacy: 82,
                tx_spending_only_taproot: 1,
                tx_spending_segwit_and_legacy: 9,
                tx_spending_nested_segwit: 126,
                tx_spending_native_segwit: 443,
                tx_spending_taproot: 1,
                tx_bip69_compliant: 391,
                tx_signaling_explicit_rbf: 210,
                tx_1_input: 499,
                tx_1_output: 177,
                tx_1_input_1_output: 112,
                tx_1_input_2_output: 339,
                tx_spending_newly_created_utxos: 110,
                tx_timelock_height: 209,
                tx_timelock_timestamp: 0,
                tx_timelock_not_enforced: 187,
                tx_timelock_too_high: 0,
            },
            input: InputStats {
                height: 739990,
                date: "2022-06-09".to_string(),
                inputs_spending_legacy: 239,
                inputs_spending_segwit: 1930,
                inputs_spending_taproot: 1,
                inputs_spending_nested_segwit: 1327,
                inputs_spending_native_segwit: 603,
                inputs_spending_multisig: 738,
                inputs_spending_p2ms_multisig: 0,
                inputs_spending_p2sh_multisig: 28,
                inputs_spending_nested_p2wsh_multisig: 672,
                inputs_spending_p2wsh_multisig: 38,
                inputs_p2pk: 0,
                inputs_p2pkh: 211,
                inputs_nested_p2wpkh: 654,
                inputs_p2wpkh: 557,
                inputs_p2ms: 0,
                inputs_p2sh: 28,
                inputs_nested_p2wsh: 673,
                inputs_p2wsh: 45,
                inputs_coinbase: 0,
                inputs_witness_coinbase: 1,
                inputs_p2tr_keypath: 1,
                inputs_p2tr_scriptpath: 0,
                inputs_p2a: 0,
                inputs_unknown: 0,
                inputs_spend_in_same_block: 110,
            },
            output: OutputStats {
                height: 739990,
                date: "2022-06-09".to_string(),
                outputs_p2pk: 0,
                outputs_p2pkh: 332,
                outputs_p2wpkh: 652,
                outputs_p2ms: 0,
                outputs_p2sh: 802,
                outputs_p2wsh: 76,
                outputs_opreturn: 13,
                outputs_p2tr: 7,
                outputs_p2a: 0,
                outputs_unknown: 0,
                outputs_p2pk_amount: 0,
                outputs_p2pkh_amount: 33803517254,
                outputs_p2wpkh_amount: 58286402491,
                outputs_p2ms_amount: 0,
                outputs_p2sh_amount: 21310299474,
                outputs_p2wsh_amount: 11638052422,
                outputs_p2tr_amount: 16313488,
                outputs_p2a_amount: 0,
                outputs_opreturn_amount: 0,
                outputs_unknown_amount: 0,
            },
            script: ScriptStats {
                height: 739990,
                date: "2022-06-09".to_string(),
                pubkeys: 3621,
                pubkeys_compressed: 3618,
                pubkeys_uncompressed: 3,
                pubkeys_compressed_inputs: 3611,
                pubkeys_uncompressed_inputs: 3,
                pubkeys_compressed_outputs: 7,
                pubkeys_uncompressed_outputs: 0,
                sigs_schnorr: 1,
                sigs_ecdsa: 2912,
                sigs_ecdsa_not_strict_der: 0,
                sigs_ecdsa_strict_der: 2912,
                sigs_ecdsa_length_less_70byte: 0,
                sigs_ecdsa_length_70byte: 7,
                sigs_ecdsa_length_71byte: 2060,
                sigs_ecdsa_length_72byte: 845,
                sigs_ecdsa_length_73byte: 0,
                sigs_ecdsa_length_74byte: 0,
                sigs_ecdsa_length_75byte_or_more: 0,
                sigs_ecdsa_low_r: 2066,
                sigs_ecdsa_high_r: 846,
                sigs_ecdsa_low_s: 2912,
                sigs_ecdsa_high_s: 0,
                sigs_ecdsa_high_rs: 0,
                sigs_ecdsa_low_rs: 2066,
                sigs_ecdsa_low_r_high_s: 0,
                sigs_ecdsa_high_r_low_s: 846,
                sigs_sighashes: 2912,
                sigs_sighash_all: 2910,
                sigs_sighash_none: 0,
                sigs_sighash_single: 0,
                sigs_sighash_all_acp: 2,
                sigs_sighash_none_acp: 0,
                sigs_sighash_single_acp: 0,
            },
        };

        diff_stats(&stats, &expected_stats);
        assert_eq!(stats, expected_stats, "see diff above");
    }

    #[test]
    fn test_block_361582() {
        let buffer = BufReader::new(File::open("./testdata/361582.json").unwrap());
        let mut de = serde_json::Deserializer::from_reader(buffer);
        let block = Block::deserialize(&mut de).expect("test block json to be valid");
        let stats = Stats::from_block(block).expect("testdata blocks should not error");

        let expected_stats = Stats {
            block: BlockStats {
                height: 361582,
                date: "2015-06-19".to_string(),
                version: 2,
                nonce: 0x444386f8,
                bits: 0x18162043,
                size: 163491,
                stripped_size: 163491,
                vsize: 163408,
                weight: 653964,
                empty: false,
                coinbase_output_amount: 2503687509,
                coinbase_weight: 408,
                transactions: 277,
                payments: 591,
                payments_segwit_spending_tx: 0,
                payments_taproot_spending_tx: 0,
                payments_signaling_explicit_rbf: 0,
                inputs: 919,
                outputs: 591,
                // This block was mined by MegaBigPower which has the ID 39
                // https://github.com/bitcoin-data/mining-pools/blob/7eb988330043456189ba6d01fd32811a1f234f2a/pool-list.json#L388-L401
                pool_id: 39,
            },
            tx: TxStats {
                height: 361582,
                date: "2015-06-19".to_string(),
                tx_version_1: 277,
                tx_version_2: 0,
                tx_version_3: 0,
                tx_version_unknown: 0,
                tx_output_amount: 305829530827,
                tx_spending_segwit: 0,
                tx_spending_only_segwit: 0,
                tx_spending_only_legacy: 276,
                tx_spending_only_taproot: 0,
                tx_spending_segwit_and_legacy: 0,
                tx_spending_nested_segwit: 0,
                tx_spending_native_segwit: 0,
                tx_spending_taproot: 0,
                tx_bip69_compliant: 116,
                tx_signaling_explicit_rbf: 0,
                tx_1_input: 146,
                tx_1_output: 31,
                tx_1_input_1_output: 16,
                tx_1_input_2_output: 125,
                tx_spending_newly_created_utxos: 45,
                tx_timelock_height: 1,
                tx_timelock_timestamp: 0,
                tx_timelock_not_enforced: 1,
                tx_timelock_too_high: 0,
            },
            input: InputStats {
                height: 361582,
                date: "2015-06-19".to_string(),
                inputs_spending_legacy: 918,
                inputs_spending_segwit: 0,
                inputs_spending_taproot: 0,
                inputs_spending_nested_segwit: 0,
                inputs_spending_native_segwit: 0,
                inputs_spending_multisig: 19,
                inputs_spending_p2ms_multisig: 0,
                inputs_spending_p2sh_multisig: 19,
                inputs_spending_nested_p2wsh_multisig: 0,
                inputs_spending_p2wsh_multisig: 0,
                inputs_p2pk: 0,
                inputs_p2pkh: 898,
                inputs_nested_p2wpkh: 0,
                inputs_p2wpkh: 0,
                inputs_p2ms: 0,
                inputs_p2sh: 20,
                inputs_nested_p2wsh: 0,
                inputs_p2wsh: 0,
                inputs_coinbase: 1,
                inputs_witness_coinbase: 0,
                inputs_p2tr_keypath: 0,
                inputs_p2tr_scriptpath: 0,
                inputs_p2a: 0,
                inputs_unknown: 0,
                inputs_spend_in_same_block: 52,
            },
            output: OutputStats {
                height: 361582,
                date: "2015-06-19".to_string(),
                outputs_p2pk: 0,
                outputs_p2pkh: 568,
                outputs_p2wpkh: 0,
                outputs_p2ms: 0,
                outputs_p2sh: 23,
                outputs_p2wsh: 0,
                outputs_opreturn: 0,
                outputs_p2tr: 0,
                outputs_p2a: 0,
                outputs_unknown: 0,
                outputs_p2pk_amount: 0,
                outputs_p2pkh_amount: 240283730043,
                outputs_p2wpkh_amount: 0,
                outputs_p2ms_amount: 0,
                outputs_p2sh_amount: 65545800784,
                outputs_p2wsh_amount: 0,
                outputs_p2tr_amount: 0,
                outputs_p2a_amount: 0,
                outputs_opreturn_amount: 0,
                outputs_unknown_amount: 0,
            },
            script: ScriptStats {
                height: 361582,
                date: "2015-06-19".to_string(),
                pubkeys: 946,
                pubkeys_compressed: 860,
                pubkeys_uncompressed: 86,
                pubkeys_compressed_inputs: 860,
                pubkeys_uncompressed_inputs: 86,
                pubkeys_compressed_outputs: 0,
                pubkeys_uncompressed_outputs: 0,
                sigs_schnorr: 0,
                sigs_ecdsa: 935,
                sigs_ecdsa_not_strict_der: 0,
                sigs_ecdsa_strict_der: 935,
                sigs_ecdsa_length_less_70byte: 0,
                sigs_ecdsa_length_70byte: 3,
                sigs_ecdsa_length_71byte: 438,
                sigs_ecdsa_length_72byte: 451,
                sigs_ecdsa_length_73byte: 43,
                sigs_ecdsa_length_74byte: 0,
                sigs_ecdsa_length_75byte_or_more: 0,
                sigs_ecdsa_low_r: 470,
                sigs_ecdsa_high_r: 465,
                sigs_ecdsa_low_s: 862,
                sigs_ecdsa_high_s: 73,
                sigs_ecdsa_high_rs: 43,
                sigs_ecdsa_low_rs: 440,
                sigs_ecdsa_low_r_high_s: 30,
                sigs_ecdsa_high_r_low_s: 422,
                sigs_sighashes: 935,
                sigs_sighash_all: 935,
                sigs_sighash_none: 0,
                sigs_sighash_single: 0,
                sigs_sighash_all_acp: 0,
                sigs_sighash_none_acp: 0,
                sigs_sighash_single_acp: 0,
            },
        };

        diff_stats(&stats, &expected_stats);
        assert_eq!(stats, expected_stats, "see diff above");
    }
}
