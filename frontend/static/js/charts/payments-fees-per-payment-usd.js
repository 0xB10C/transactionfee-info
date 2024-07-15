const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/FeeSum_sum.csv"),
  d3.csv("/csv/Payments_sum.csv"),
  d3.csv("/csv/price.csv")
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y = parseFloat(data[1][i].FeeSum_sum) / parseFloat(data[2][i].Payments_sum) * parseFloat(data[3][i].price / 100_000_000)
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = []
const labels = {"y": "Fee per Payment"}
const dataType = dataTypeFloat
const unit = "USD"

var yValue = (d => d.y);
var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])

const chartFunction = lineWithAreaChart
