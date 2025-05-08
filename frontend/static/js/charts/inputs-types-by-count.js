const ANNOTATIONS = [annotationSegWitActivated, annotationBitcoinCoreSegWitWalletReleased, annotationBitcoinCore23, annotationTaprootActivated, annotationP2SHActivation]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_30D
const NAMES = ["P2PK", "P2PKH", "nested P2WPKH", "P2WPKH", "P2MS", "P2SH", "nested P2WSH", "P2WSH", "P2TR key-path", "P2TR script-path", "Unknown", "Coinbase", "P2A", "other"]
const PRECISION = 1
let START_DATE =  new Date("2015");

const CSVs = [
  fetchCSV("/csv/date.csv"), // 0
  fetchCSV("/csv/inputs_p2pk_sum.csv"),
  fetchCSV("/csv/inputs_p2pkh_sum.csv"),
  fetchCSV("/csv/inputs_nested_p2wpkh_sum.csv"),
  fetchCSV("/csv/inputs_p2wpkh_sum.csv"),
  fetchCSV("/csv/inputs_p2ms_sum.csv"), // 5
  fetchCSV("/csv/inputs_p2sh_sum.csv"),
  fetchCSV("/csv/inputs_nested_p2wsh_sum.csv"),
  fetchCSV("/csv/inputs_p2wsh_sum.csv"),
  fetchCSV("/csv/inputs_p2tr_keypath_sum.csv"),
  fetchCSV("/csv/inputs_p2tr_scriptpath_sum.csv"), // 10
  fetchCSV("/csv/inputs_unknown_sum.csv"),
  fetchCSV("/csv/inputs_coinbase_sum.csv"),
  fetchCSV("/csv/inputs_witness_coinbase_sum.csv"),
  fetchCSV("/csv/inputs_p2a_sum.csv"),
  fetchCSV("/csv/inputs_sum.csv"), // 15
]

function preprocess(input) {
  let data = { date: [], p2pk: [], p2pkh: [], nested_p2wpkh: [], p2wpkh: [], p2ms: [], p2sh: [], nested_p2wsh: [], p2wsh: [], p2tr_keypath: [], p2tr_scriptpath: [], unknown: [], coinbase: [], p2a: [], other: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    let counted_total = 0
    const ins_P2PK = parseFloat(input[1][i].inputs_p2pk_sum)
    counted_total += ins_P2PK
    const ins_P2PKH = parseFloat(input[2][i].inputs_p2pkh_sum)
    counted_total += ins_P2PKH
    const ins_Nested_P2WPKH = parseFloat(input[3][i].inputs_nested_p2wpkh_sum)
    counted_total += ins_Nested_P2WPKH
    const ins_P2WPKH = parseFloat(input[4][i].inputs_p2wpkh_sum)
    counted_total += ins_P2WPKH
    const ins_P2MS = parseFloat(input[5][i].inputs_p2ms_sum)
    counted_total += ins_P2MS
    const ins_P2SH = parseFloat(input[6][i].inputs_p2sh_sum)
    counted_total += ins_P2SH
    const ins_Nested_P2WSH = parseFloat(input[7][i].inputs_nested_p2wsh_sum)
    counted_total += ins_Nested_P2WSH
    const ins_P2WSH = parseFloat(input[8][i].inputs_p2wsh_sum)
    counted_total += ins_P2WSH
    const ins_p2trKeypath = parseFloat(input[9][i].inputs_p2tr_keypath_sum)
    counted_total += ins_p2trKeypath
    const ins_p2trScriptpath = parseFloat(input[10][i].inputs_p2tr_scriptpath_sum)
    counted_total += ins_p2trScriptpath
    const ins_unknown = parseFloat(input[11][i].inputs_unknown_sum)
    counted_total += ins_unknown
    const ins_coinbase = parseFloat(input[12][i].inputs_coinbase_sum) + parseFloat(input[13][i].inputs_witness_coinbase_sum)
    counted_total += ins_coinbase
    const ins_p2a = parseFloat(input[14][i].inputs_p2a_sum)
    counted_total += ins_p2a

    const ins_total = parseFloat(input[15][i].inputs_sum)

    const ins_P2PK_percentage = ins_P2PK / ins_total || 0
    const ins_P2PKH_percentage = ins_P2PKH / ins_total || 0
    const ins_Nested_P2WPKH_percentage = ins_Nested_P2WPKH / ins_total || 0
    const ins_P2WPKH_percentage = ins_P2WPKH / ins_total || 0
    const ins_P2MS_percentage = ins_P2MS / ins_total || 0
    const ins_P2SH_percentage = ins_P2SH / ins_total || 0
    const ins_Nested_P2WSH_percentage = ins_Nested_P2WSH / ins_total || 0
    const ins_P2WSH_percentage = ins_P2WSH / ins_total || 0
    const ins_p2trKeypath_percentage = ins_p2trKeypath / ins_total || 0
    const ins_p2trScriptpath_percentage = ins_p2trScriptpath / ins_total || 0
    const ins_unknown_percentage = ins_unknown / ins_total || 0
    const ins_coinbase_percentage = ins_coinbase / ins_total || 0
    const ins_p2a_percentage = ins_p2a / ins_total || 0

    const ins_other = (ins_total - counted_total) / ins_total || 0

    data.p2pk.push(ins_P2PK_percentage * 100)
    data.p2pkh.push(ins_P2PKH_percentage * 100)
    data.nested_p2wpkh.push(ins_Nested_P2WPKH_percentage * 100)
    data.p2wpkh.push(ins_P2WPKH_percentage * 100)
    data.p2ms.push(ins_P2MS_percentage * 100)
    data.p2sh.push(ins_P2SH_percentage * 100)
    data.nested_p2wsh.push(ins_Nested_P2WSH_percentage * 100)
    data.p2wsh.push(ins_P2WSH_percentage * 100)
    data.p2tr_keypath.push(ins_p2trKeypath_percentage * 100)
    data.p2tr_scriptpath.push(ins_p2trScriptpath_percentage * 100)
    data.unknown.push(ins_unknown_percentage * 100)
    data.coinbase.push(ins_coinbase_percentage * 100)
    data.p2a.push(ins_p2a_percentage * 100)
    data.other.push(ins_other * 100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  const DATA_KEYS = ["p2pk", "p2pkh", "nested_p2wpkh", "p2wpkh", "p2ms", "p2sh", "nested_p2wsh", "p2wsh", "p2tr_keypath", "p2tr_scriptpath", "unknown", "coinbase", "p2a", "other"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}