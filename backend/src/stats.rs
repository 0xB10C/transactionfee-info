use chrono::DateTime;
use diesel::prelude::*;
use log::error;
use rawtx_rs::bitcoin::{Block, Transaction, Txid};
use rawtx_rs::{input::InputType, output::OutputType, script::SignatureType, tx::TxInfo};
use std::collections::HashSet;
use std::{error, fmt};

#[derive(Debug, Clone)]
pub enum StatsError {
    TxInfoError(rawtx_rs::tx::TxInfoError),
}

impl fmt::Display for StatsError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            StatsError::TxInfoError(e) => write!(f, "Bitcoin Script Error: {:?}", e),
        }
    }
}

impl error::Error for StatsError {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match *self {
            StatsError::TxInfoError(ref e) => Some(e),
        }
    }
}

impl From<rawtx_rs::tx::TxInfoError> for StatsError {
    fn from(e: rawtx_rs::tx::TxInfoError) -> Self {
        StatsError::TxInfoError(e)
    }
}

#[derive(Debug, Clone)]
pub struct Stats {
    pub block: BlockStats,
    pub tx: TxStats,
    pub input: InputStats,
    pub output: OutputStats,
    //feerate: FeerateStats,
    pub script: ScriptStats,
}

impl Stats {
    pub fn from_block_and_height(block: Block, height: i64) -> Result<Stats, StatsError> {
        let timestamp = DateTime::from_timestamp(block.header.time as i64, 0)
            .expect("invalid block header timestamp");
        let date = timestamp.format("%Y-%m-%d").to_string();
        let mut tx_infos: Vec<TxInfo> = Vec::with_capacity(block.txdata.len());
        for tx in block.txdata.iter() {
            match TxInfo::new(tx) {
                Ok(txinfo) => tx_infos.push(txinfo),
                Err(e) => {
                    error!(
                        "Could not create TxInfo for {} in block {}: {}",
                        tx.txid(),
                        height,
                        e
                    );
                    return Err(StatsError::TxInfoError(e));
                }
            }
        }

        Ok(Stats {
            block: BlockStats::from_block_and_height(&block, height, date.clone(), &tx_infos),
            tx: TxStats::from_block_and_height(&block, height, date.clone(), &tx_infos),
            input: InputStats::from_block_and_height(&block, height, date.clone(), &tx_infos),
            output: OutputStats::from_block_and_height(&block, height, date.clone(), &tx_infos),
            script: ScriptStats::from_block_and_height(&block, height, date.clone(), &tx_infos),
        })
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Debug)]
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

            size: block.total_size() as i64,
            stripped_size: block
                .txdata
                .iter()
                .map(Transaction::base_size)
                .sum::<usize>() as i64,
            vsize: block.txdata.iter().map(Transaction::vsize).sum::<usize>() as i64,
            weight: block.weight().to_wu() as i64,
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

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Default, Debug)]
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
        let mut s = TxStats::default();

        let txids_in_this_block: HashSet<Txid> = block.txdata.iter().map(|tx| tx.txid()).collect();

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

            if tx
                .input
                .iter()
                .any(|i| txids_in_this_block.contains(&i.previous_output.txid))
            {
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

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Default, Debug)]
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
    pub fn from_block_and_height(
        block: &Block,
        height: i64,
        date: String,
        tx_infos: &Vec<TxInfo>,
    ) -> ScriptStats {
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

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Default, Debug)]
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
    pub fn from_block_and_height(
        block: &Block,
        height: i64,
        date: String,
        tx_infos: &Vec<TxInfo>,
    ) -> InputStats {
        let txids_in_this_block: HashSet<Txid> = block.txdata.iter().map(|tx| tx.txid()).collect();

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
                    InputType::P2a => s.inputs_p2a += 1,
                    InputType::Unknown => s.inputs_unknown += 1,
                }
            }
            for input in tx.input.iter() {
                if txids_in_this_block.contains(&input.previous_output.txid) {
                    s.inputs_spend_in_same_block += 1;
                }
            }
        }
        s
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Default, Debug)]
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
    pub fn from_block_and_height(
        block: &Block,
        height: i64,
        date: String,
        tx_infos: &Vec<TxInfo>,
    ) -> OutputStats {
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

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Debug)]
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
    use crate::Stats;
    use rawtx_rs::bitcoin;
    use std::fs::File;
    use std::io::BufReader;
    use std::io::Read;

    #[test]
    fn test_block_739990() {
        // converted from 739990.hex with xxd -r -p 739990.hex > 739990.bin
        let mut buffer = BufReader::new(File::open("./testdata/739990.bin").unwrap());
        const CAPACITY_FOR_739990: usize = 536844;
        let mut block_bytes: Vec<u8> = Vec::with_capacity(CAPACITY_FOR_739990);
        let bytes_read = buffer.read_to_end(&mut block_bytes);
        // to keep the capacity up-to-date and copy & paste proof
        assert_eq!(bytes_read.unwrap(), CAPACITY_FOR_739990);
        let block: bitcoin::Block =
            bitcoin::consensus::deserialize(&block_bytes).expect("testdata block should be valid");
        let stats =
            Stats::from_block_and_height(block, 739990).expect("testdata blocks should not error");

        assert_eq!(stats.block.transactions, 645);

        // an earlier version skipped the coinbase transaction
        assert_eq!(stats.input.inputs_witness_coinbase, 1);

        // TODO: extend coverage
    }

    #[test]
    fn test_block_361582() {
        // converted from 361582.hex with xxd -r -p 361582.hex > 361582.bin
        let mut buffer = BufReader::new(File::open("./testdata/361582.bin").unwrap());
        const CAPACITY_FOR_361582: usize = 163491;
        let mut block_bytes: Vec<u8> = Vec::with_capacity(CAPACITY_FOR_361582);
        let bytes_read = buffer.read_to_end(&mut block_bytes);
        // to keep the capacity up-to-date and copy & paste proof
        assert_eq!(bytes_read.unwrap(), CAPACITY_FOR_361582);
        let block: bitcoin::Block =
            bitcoin::consensus::deserialize(&block_bytes).expect("testdata block should be valid");
        let stats =
            Stats::from_block_and_height(block, 361582).expect("testdata blocks should not error");

        assert_eq!(stats.block.transactions, 277);

        // an earlier version skipped the coinbase transaction
        assert_eq!(stats.input.inputs_coinbase, 1);

        // TODO: extend coverage
    }
}
