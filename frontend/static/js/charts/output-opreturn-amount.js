const chartRollingAverage = 1

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/OutputsOPRETURNAmount_sum.csv"),
]

function preprocess(data) {
  cumulativeValue = 0
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    cumulativeValue += parseFloat(data[1][i].OutputsOPRETURNAmount_sum)
    const y = cumulativeValue
    combinedData.push({date, y})
  }
  
  return combinedData
}

const annotations = []
const labels = {"y": "Outputs"}
const dataType = dataTypeInteger
const unit = "sat"

var yValue = (d => d.y);
var yDomain = (data => [d3.min(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : Infinity), d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])

const chartFunction = lineWithAreaChart
