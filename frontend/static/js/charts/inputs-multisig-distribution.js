const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/InputsSpendingP2MSMultiSig_sum.csv"),
  d3.csv("/csv/InputsSpendingP2SHMultiSig_sum.csv"),
  d3.csv("/csv/InputsSpendingNestedP2WSHMultisig_sum.csv"),
  d3.csv("/csv/InputsSpendingP2WSHMultisig_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const ms_P2MS = parseFloat(data[1][i].InputsSpendingP2MSMultiSig_sum)
    const ms_P2SH = parseFloat(data[2][i].InputsSpendingP2SHMultiSig_sum)
    const ms_Nested_P2WSH = parseFloat(data[3][i].InputsSpendingNestedP2WSHMultisig_sum)
    const ms_P2WSH = parseFloat(data[4][i].InputsSpendingP2WSHMultisig_sum)

    const total = ms_P2MS + ms_P2SH + ms_Nested_P2WSH + ms_P2WSH

    const ms_P2MS_percentage = ms_P2MS / total || 0
    const ms_P2SH_percentage = ms_P2SH / total || 0
    const ms_Nested_P2WSH_percentage = ms_Nested_P2WSH / total || 0
    const ms_P2WSH_percentage = ms_P2WSH / total || 0

    const filler = total == 0 ? 1 : 0

    combinedData.push({date, ms_P2MS_percentage, ms_P2SH_percentage, ms_Nested_P2WSH_percentage, ms_P2WSH_percentage, filler})
  }
  
  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2017-07-01")
const annotations = [annotationSegWitActivated]
const labels = {"ms_P2MS_percentage": "P2MS", "ms_Nested_P2WSH_percentage": "Nested P2WSH", "ms_P2SH_percentage": "P2SH", "ms_P2WSH_percentage": "P2WSH"}
const dataType = dataTypePercentage
const unit = ""

var keys = ["ms_P2MS_percentage", "ms_P2SH_percentage", "ms_Nested_P2WSH_percentage", "ms_P2WSH_percentage"]
var colors = {"ms_P2MS_percentage": colorP2MS, "ms_Nested_P2WSH_percentage": colorNestedP2WSH, "ms_P2SH_percentage": colorP2SH, "ms_P2WSH_percentage": colorP2WSH}

const chartFunction = stackedAreaChart
