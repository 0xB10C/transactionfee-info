const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/SigECDSALowS_sum.csv"),
  d3.csv("/csv/SigECDSAHighS_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const lowS = parseFloat(data[1][i].SigECDSALowS_sum)
    const highS = parseFloat(data[2][i].SigECDSAHighS_sum)

    const total = lowS + highS

    const lowS_percentage = lowS / total || 0
    const highS_percentage = highS / total || 0

    const filler = total == 0 ? 1 : 0

    combinedData.push({date, lowS_percentage, highS_percentage, filler})
  }
  
  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2013-01-01")
const annotations = [annotationBitcoinCorev0_9, annotationBitcoinCorev0_11_1]
const labels = {"lowS_percentage": "low-S", "highS_percentage": "high-S"}
const dataType = dataTypePercentage
const unit = ""

var keys = ["lowS_percentage", "highS_percentage"] 
var colors = {"lowS_percentage":  colorBLUE, "highS_percentage": colorYELLOW}

const chartFunction = stackedAreaChart
