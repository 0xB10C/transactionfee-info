const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/inputs_p2pk_sum.csv"),
  d3.csv("/csv/inputs_p2pkh_sum.csv"),
  d3.csv("/csv/inputs_nested_p2wpkh_sum.csv"),
  d3.csv("/csv/inputs_p2wpkh_sum.csv"),
  d3.csv("/csv/inputs_p2ms_sum.csv"),
  d3.csv("/csv/inputs_p2sh_sum.csv"),
  d3.csv("/csv/inputs_nested_p2wsh_sum.csv"),
  d3.csv("/csv/inputs_p2wsh_sum.csv"),
  d3.csv("/csv/inputs_p2tr_keypath_sum.csv"),
  d3.csv("/csv/inputs_p2tr_scriptpath_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)

    const ins_P2PK = parseFloat(data[1][i].inputs_p2pk_sum)
    const ins_P2PKH = parseFloat(data[2][i].inputs_p2pkh_sum)
    const ins_Nested_P2WPKH = parseFloat(data[3][i].inputs_nested_p2wpkh_sum)
    const ins_P2WPKH = parseFloat(data[4][i].inputs_p2wpkh_sum)
    const ins_P2MS = parseFloat(data[5][i].inputs_p2ms_sum)
    const ins_P2SH = parseFloat(data[6][i].inputs_p2sh_sum)
    const ins_Nested_P2WSH = parseFloat(data[7][i].inputs_nested_p2wsh_sum)
    const ins_P2WSH = parseFloat(data[8][i].inputs_p2wsh_sum)
    const ins_p2trKeypath = parseFloat(data[9][i].inputs_p2tr_keypath_sum)
    const ins_p2trScriptpath = parseFloat(data[10][i].inputs_p2tr_scriptpath_sum)

    const total = ins_P2PK + ins_P2PKH + ins_Nested_P2WPKH + ins_P2WPKH + ins_P2MS + ins_P2SH + ins_Nested_P2WSH + ins_P2WSH + ins_p2trKeypath + ins_p2trScriptpath

    const ins_P2PK_percentage = ins_P2PK / total || 0
    const ins_P2PKH_percentage = ins_P2PKH / total || 0
    const ins_Nested_P2WPKH_percentage = ins_Nested_P2WPKH / total || 0
    const ins_P2WPKH_percentage = ins_P2WPKH / total || 0
    const ins_P2MS_percentage = ins_P2MS / total || 0
    const ins_P2SH_percentage = ins_P2SH / total || 0
    const ins_Nested_P2WSH_percentage = ins_Nested_P2WSH / total || 0
    const ins_P2WSH_percentage = ins_P2WSH / total || 0
    const ins_p2trKeypath_percentage = ins_p2trKeypath / total || 0
    const ins_p2trScriptpath_percentage = ins_p2trScriptpath / total || 0

    combinedData.push({date, ins_P2PK_percentage, ins_P2PKH_percentage, ins_Nested_P2WPKH_percentage, ins_P2WPKH_percentage, ins_P2MS_percentage, ins_P2SH_percentage, ins_Nested_P2WSH_percentage, ins_P2WSH_percentage, ins_p2trKeypath_percentage, ins_p2trScriptpath_percentage})
  }

  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2015-01-01")
const annotations = [{'text': 'P2SH Activation', 'date': '2012-04-01'},{'text': 'SegWit Activation', 'date': '2017-07-24'}]
const keys = ["ins_P2PK_percentage", "ins_P2PKH_percentage", "ins_Nested_P2WPKH_percentage", "ins_P2WPKH_percentage", "ins_P2MS_percentage", "ins_P2SH_percentage", "ins_Nested_P2WSH_percentage", "ins_P2WSH_percentage", "ins_p2trKeypath_percentage", "ins_p2trScriptpath_percentage"]
const colors = {"ins_P2PK_percentage": colorP2PK, "ins_P2PKH_percentage": colorP2PKH, "ins_Nested_P2WPKH_percentage": colorNestedP2WPKH, "ins_P2WPKH_percentage": colorP2WPKH, "ins_P2MS_percentage": colorP2MS, "ins_P2SH_percentage": colorP2SH, "ins_Nested_P2WSH_percentage": colorNestedP2WSH, "ins_P2WSH_percentage": colorP2WSH, "ins_p2trKeypath_percentage": colorP2TR, "ins_p2trScriptpath_percentage": colorTEAL}
const labels = {"ins_P2PK_percentage": "P2PK", "ins_P2PKH_percentage": "P2PKH", "ins_Nested_P2WPKH_percentage": "Nested P2WPKH", "ins_P2WPKH_percentage": "P2WPKH", "ins_P2MS_percentage": "P2MS", "ins_P2SH_percentage": "P2SH", "ins_Nested_P2WSH_percentage": "Nested P2WSH", "ins_P2WSH_percentage": "P2WSH", "ins_p2trKeypath_percentage": "P2TR key-path", "ins_p2trScriptpath_percentage": "P2TR script-path"}
const dataType = dataTypePercentage
const unit = ""

const chartFunction = stackedAreaChart
