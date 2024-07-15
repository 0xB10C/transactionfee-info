const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/SigECDSALowR_sum.csv"),
  d3.csv("/csv/SigECDSAHighR_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const lowR = parseFloat(data[1][i].SigECDSALowR_sum)
    const highR = parseFloat(data[2][i].SigECDSAHighR_sum)

    const total = lowR + highR

    const lowR_percentage = lowR / total || 0
    const highR_percentage = highR / total || 0

    const filler = total == 0 ? 1 : 0

    combinedData.push({date, lowR_percentage, highR_percentage, filler})
  }
  
  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2010-03-01")
const annotations = [annotationBitcoinCorev0_17]
const labels = {"lowR_percentage": "low r", "highR_percentage": "high r"}
const dataType = dataTypePercentage
const unit = ""

var keys = ["lowR_percentage", "highR_percentage"] 
var colors = {"lowR_percentage":  colorBLUE, "highR_percentage": colorYELLOW}

const chartFunction = stackedAreaChart
