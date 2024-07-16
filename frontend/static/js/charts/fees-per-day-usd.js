const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  // TODO: these are the file names from the Go-version of transactionfee.info
  // and would need to be updated to the Rust version as soon as fee data is
  // available.
  d3.csv("/csv/FeeSum_sum.csv"),
  // No price data available.
  d3.csv("/csv/price.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y = parseFloat(data[1][i].FeeSum_sum / 100_000_000) * parseFloat(data[2][i].price) / 1_000_000
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = []
const labels = {"y": "fees per day"}
const dataType = dataTypeFloat
const unit = "million USD"

var yValue = (d => d.y);
var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])
yAxis.tickFormat(d3.format("~s"));

const chartFunction = lineWithAreaChart
