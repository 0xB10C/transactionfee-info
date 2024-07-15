const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/SigECDSALength70Byte_sum.csv"),
  d3.csv("/csv/SigECDSALength71Byte_sum.csv"),
  d3.csv("/csv/SigECDSALength72Byte_sum.csv"),
  d3.csv("/csv/SigECDSALength73Byte_sum.csv"),
  d3.csv("/csv/SigECDSALength74Byte_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  total = 0
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const len70 = parseFloat(data[1][i].SigECDSALength70Byte_sum)
    const len71 = parseFloat(data[2][i].SigECDSALength71Byte_sum)
    const len72 = parseFloat(data[3][i].SigECDSALength72Byte_sum)
    const len73 = parseFloat(data[4][i].SigECDSALength73Byte_sum)
    const len74 = parseFloat(data[5][i].SigECDSALength74Byte_sum)
    total = total + ((len70*70) + (len71*71) + (len72*72) + (len73*73) + (len74*74)) / 1000000000
    const y = total
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = []
const labels = {"y": "ECDSA signature size"}
const dataType = dataTypeFloat
const unit = "GB"
const startDate = d3.timeParse("%Y-%m-%d")("2011-01-01")

var yValue = (d => d.y);
var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])

const chartFunction = lineWithAreaChart
