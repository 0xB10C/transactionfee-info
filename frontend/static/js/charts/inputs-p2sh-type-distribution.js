const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/inputs_p2sh_sum.csv"),
  d3.csv("/csv/inputs_nested_p2wpkh_sum.csv"),
  d3.csv("/csv/inputs_nested_p2wsh_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const P2SH = parseFloat(data[1][i].inputs_p2sh_sum)
    const NestedP2WPKH = parseFloat(data[2][i].inputs_nested_p2wpkh_sum)
    const NestedP2WSH = parseFloat(data[3][i].inputs_nested_p2wsh_sum)

    const total = P2SH + NestedP2WPKH + NestedP2WSH

    const P2SH_percentage = P2SH / total || 0
    const NestedP2WPKH_percentage = NestedP2WPKH / total || 0
    const NestedP2WSH_percentage = NestedP2WSH / total || 0

    const filler = total == 0 ? 1 : 0

    combinedData.push({date, P2SH_percentage, NestedP2WPKH_percentage, NestedP2WSH_percentage, filler})
  }

  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2017-07-01")
const annotations = [annotationSegWitActivated]
const labels = {"P2SH_percentage": "P2SH", "NestedP2WPKH_percentage": "Nested P2WPKH", "NestedP2WSH_percentage": "Nested P2WSH"}
const dataType = dataTypePercentage
const unit = ""

var keys = ["P2SH_percentage", "NestedP2WPKH_percentage", "NestedP2WSH_percentage"]
var colors = {"P2SH_percentage": colorP2SH, "NestedP2WSH_percentage": colorNestedP2WSH, "NestedP2WPKH_percentage": colorNestedP2WPKH}

const chartFunction = stackedAreaChart
