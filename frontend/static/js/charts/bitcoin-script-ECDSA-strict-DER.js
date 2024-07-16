const chartRollingAverage = 1

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/sigs_ecdsa_strict_der_sum.csv"),
  d3.csv("/csv/sigs_ecdsa_not_strict_der_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const strict = parseFloat(data[1][i].sigs_ecdsa_strict_der_sum)
    const notStrict = parseFloat(data[2][i].sigs_ecdsa_not_strict_der_sum)

    const total = strict + notStrict

    const strict_percentage = strict / total || 0
    const notStrict_percentage = notStrict / total || 0

    const filler = total == 0 ? 1 : 0

    combinedData.push({date, strict_percentage, notStrict_percentage, filler})
  }

  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2010-03-01")
const annotations = [annotationBIP66Activated]
const labels = {"strict_percentage": "DER", "notStrict_percentage": "not DER"}
const dataType = dataTypePercentage
const unit = ""

var keys = ["strict_percentage", "notStrict_percentage"]
var colors = {"strict_percentage":  colorBLUE, "notStrict_percentage": colorYELLOW}

const chartFunction = stackedAreaChart
