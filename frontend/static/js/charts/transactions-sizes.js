const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/size_sum.csv"), // block size
  d3.csv("/csv/stripped_size_sum.csv"), // block stripped size
  d3.csv("/csv/transactions_sum.csv")
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const tx_per_day = parseFloat(data[3][i].transactions_sum)
    const y1 = parseFloat(data[2][i].stripped_size_sum) / tx_per_day || 0
    const y2 = parseFloat(data[1][i].size_sum) / tx_per_day || 0

    combinedData.push({date, y1, y2})
  }
  return combinedData
}

const annotations = []
const labels = {"y1": "vsize", "y2": "size"}
const dataType = dataTypeInteger
const unit = "vbyte"

const chartFunction = twoLineChart
