const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/SizeAvg_avg.csv"),
  d3.csv("/csv/Size50thPercentile_avg.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y1 = parseFloat(data[2][i].Size50thPercentile_avg)
    const y2 = parseFloat(data[1][i].SizeAvg_avg)
    combinedData.push({date, y1, y2})
  }
  return combinedData
}

const annotations = []
const labels = {"y1": "Median", "y2": "Average"}
const dataType = dataTypeInteger
const unit = "vbyte"

const chartFunction = twoLineChart
