const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/outputs_p2pk_sum.csv"),
  d3.csv("/csv/outputs_p2pkh_sum.csv"),
  d3.csv("/csv/outputs_p2wpkh_sum.csv"),
  d3.csv("/csv/outputs_p2ms_sum.csv"),
  d3.csv("/csv/outputs_p2sh_sum.csv"),
  d3.csv("/csv/outputs_p2wsh_sum.csv"),
  d3.csv("/csv/outputs_p2tr_sum.csv"),
  d3.csv("/csv/outputs_opreturn_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)

    const outs_P2PK = parseFloat(data[1][i].outputs_p2pk_sum)
    const outs_P2PKH = parseFloat(data[2][i].outputs_p2pkh_sum)
    const outs_P2WPKH = parseFloat(data[3][i].outputs_p2wpkh_sum)
    const outs_P2MS = parseFloat(data[4][i].outputs_p2ms_sum)
    const outs_P2SH = parseFloat(data[5][i].outputs_p2sh_sum)
    const outs_P2WSH = parseFloat(data[6][i].outputs_p2wsh_sum)
    const outs_P2TR = parseFloat(data[7][i].outputs_p2tr_sum)
    const outs_OPRETURN = parseFloat(data[8][i].outputs_opreturn_sum)

    const total = outs_P2PK + outs_P2PKH + outs_P2WPKH + outs_P2MS + outs_P2SH + outs_OPRETURN + outs_P2WSH + outs_P2TR

    const outs_P2PK_percentage = outs_P2PK / total || 0
    const outs_P2PKH_percentage = outs_P2PKH / total || 0
    const outs_P2WPKH_percentage = outs_P2WPKH / total || 0
    const outs_P2MS_percentage = outs_P2MS / total || 0
    const outs_P2SH_percentage = outs_P2SH / total || 0
    const outs_P2WSH_percentage = outs_P2WSH / total || 0
    const outs_P2TR_percentage = outs_P2TR / total || 0
    const outs_OPRETURN_percentage = outs_OPRETURN / total || 0

    combinedData.push({date, outs_P2PK_percentage, outs_P2PKH_percentage, outs_P2MS_percentage, outs_P2SH_percentage, outs_OPRETURN_percentage, outs_P2WPKH_percentage, outs_P2WSH_percentage, outs_P2TR_percentage})
  }

  return combinedData

}
const startDate = d3.timeParse("%Y-%m-%d")("2016-01-01")
const annotations = [{'text': 'P2SH Activation', 'date': '2012-04-01'},{'text': 'SegWit Activation', 'date': '2017-07-24'}]
const keys = ["outs_P2PK_percentage", "outs_P2PKH_percentage", "outs_P2MS_percentage", "outs_OPRETURN_percentage","outs_P2SH_percentage", "outs_P2WPKH_percentage", "outs_P2WSH_percentage", "outs_P2TR_percentage"]
const colors = {"outs_P2PK_percentage": colorP2PK, "outs_P2PKH_percentage": colorP2PKH, "outs_OPRETURN_percentage": colorOPRETURN, "outs_P2WPKH_percentage": colorP2WPKH, "outs_P2MS_percentage": colorP2MS, "outs_P2SH_percentage": colorP2SH, "outs_P2WSH_percentage": colorP2WSH, "outs_P2TR_percentage": colorP2TR}
const labels = {"outs_P2PK_percentage": "P2PK", "outs_P2PKH_percentage": "P2PKH", "outs_OPRETURN_percentage": "OP_RETURN", "outs_P2WPKH_percentage": "P2WPKH", "outs_P2MS_percentage": "P2MS", "outs_P2SH_percentage": "P2SH", "outs_P2WSH_percentage": "P2WSH", "outs_P2TR_percentage": "P2TR"}
const dataType = dataTypePercentage
const unit = ""

const chartFunction = stackedAreaChart
