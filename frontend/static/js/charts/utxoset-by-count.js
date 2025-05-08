const ANNOTATIONS = [annotationP2SHActivation, annotationSegWitActivated, annotationTaprootActivated, annotationInscriptionsHype]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_30D
const NAMES =     ["P2PKH", "P2PK", "P2MS", "P2SH", "P2WSH", "P2WPKH", "P2TR", "P2A"]
const DATA_KEYS = ["p2pkh", "p2pk", "p2ms", "p2sh", "p2wsh", "p2wpkh", "p2tr", "p2a"]
const PRECISION = 0
const UNIT = ""
let START_DATE =  new Date("2013");

const CSVs = [
  fetchCSV("/csv/date.csv"), // 0
  fetchCSV("/csv/outputs_p2pk_sum.csv"),
  fetchCSV("/csv/outputs_p2pkh_sum.csv"),
  fetchCSV("/csv/outputs_p2wpkh_sum.csv"),
  fetchCSV("/csv/outputs_p2ms_sum.csv"),
  fetchCSV("/csv/outputs_p2sh_sum.csv"), // 5
  fetchCSV("/csv/outputs_p2wsh_sum.csv"),
  fetchCSV("/csv/outputs_p2tr_sum.csv"),
  fetchCSV("/csv/outputs_p2a_sum.csv"), // 8

  fetchCSV("/csv/inputs_p2pk_sum.csv"), // 9
  fetchCSV("/csv/inputs_p2pkh_sum.csv"),
  fetchCSV("/csv/inputs_nested_p2wpkh_sum.csv"),
  fetchCSV("/csv/inputs_p2wpkh_sum.csv"),
  fetchCSV("/csv/inputs_p2ms_sum.csv"), 
  fetchCSV("/csv/inputs_p2sh_sum.csv"),
  fetchCSV("/csv/inputs_nested_p2wsh_sum.csv"), // 15
  fetchCSV("/csv/inputs_p2wsh_sum.csv"),
  fetchCSV("/csv/inputs_p2tr_keypath_sum.csv"),
  fetchCSV("/csv/inputs_p2tr_scriptpath_sum.csv"),
  fetchCSV("/csv/inputs_p2a_sum.csv"), // 19
]

function preprocess(input) {
  let p2pk = 0, p2pkh = 0, p2wpkh = 0, p2ms = 0, p2sh = 0, p2wsh = 0, p2tr = 0, p2a = 0
  let data = { date: [], p2pk: [], p2pkh: [], p2wpkh: [], p2ms: [], p2sh: [], p2wsh: [], p2tr: [], p2a: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const outs_P2PK = parseFloat(input[1][i].outputs_p2pk_sum)
    p2pk += outs_P2PK
    const outs_P2PKH = parseFloat(input[2][i].outputs_p2pkh_sum)
    p2pkh += outs_P2PKH
    const outs_P2WPKH = parseFloat(input[3][i].outputs_p2wpkh_sum)
    p2wpkh += outs_P2WPKH
    const outs_P2MS = parseFloat(input[4][i].outputs_p2ms_sum)
    p2ms += outs_P2MS
    const outs_P2SH = parseFloat(input[5][i].outputs_p2sh_sum)
    p2sh += outs_P2SH
    const outs_P2WSH = parseFloat(input[6][i].outputs_p2wsh_sum)
    p2wsh += outs_P2WSH
    const outs_P2TR = parseFloat(input[7][i].outputs_p2tr_sum)
    p2tr += outs_P2TR
    const outs_P2A = parseFloat(input[8][i].outputs_p2a_sum)
    p2a += outs_P2A

    const ins_P2PK = parseFloat(input[9][i].inputs_p2pk_sum)
    p2pk -= ins_P2PK
    const ins_P2PKH = parseFloat(input[10][i].inputs_p2pkh_sum)
    p2pkh -= ins_P2PKH
    const ins_P2SH = parseFloat(input[14][i].inputs_p2sh_sum) + parseFloat(input[11][i].inputs_nested_p2wpkh_sum) + parseFloat(input[15][i].inputs_nested_p2wsh_sum)
    p2sh -= ins_P2SH
    const ins_P2WPKH = parseFloat(input[12][i].inputs_p2wpkh_sum)
    p2wpkh -= ins_P2WPKH
    const ins_P2MS = parseFloat(input[13][i].inputs_p2ms_sum)
    p2ms -= ins_P2MS
    const ins_P2WSH = parseFloat(input[16][i].inputs_p2wsh_sum)
    p2wsh -= ins_P2WSH
    const ins_P2TR = parseFloat(input[17][i].inputs_p2tr_keypath_sum) + parseFloat(input[18][i].inputs_p2tr_scriptpath_sum)
    p2tr -= ins_P2TR
    const ins_P2A = parseFloat(input[19][i].inputs_p2a_sum)
    p2a -= ins_P2A
    
    data.p2pk.push(p2pk)
    data.p2pkh.push(p2pkh)
    data.p2sh.push(p2sh)
    data.p2wpkh.push(p2wpkh)
    data.p2ms.push(p2ms)
    data.p2wsh.push(p2wsh)
    data.p2tr.push(p2tr)
    data.p2a.push(p2a)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  let option = stackedAreaChart(d, DATA_KEYS, NAMES, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
  option.tooltip["order"] = "seriesDesc"
  return option
}