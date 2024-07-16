const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/FeeSum_sum.csv"),
  d3.csv("/csv/payments_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y = parseFloat(data[1][i].FeeSum_sum) / parseFloat(data[2][i].payments_sum)
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = []
const labels = {"y": "Fee per Payment"}
const dataType = dataTypeFloat
const unit = "sat"

var yValue = (d => d.y);
var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])

const chartFunction = lineWithAreaChart
