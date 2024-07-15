const chartRollingAverage = 1

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/CoinbaseOutputAmount_avg.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y = parseFloat(data[1][i].CoinbaseOutputAmount_avg) / 100_000_000
    combinedData.push({date, y})
  }
  
  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2010-01-01")
const annotations = [{ 'text': '1st Halvening', 'date': '2012-11-28' }, { 'text': '2nd Halvening', 'date': '2016-07-09' }, { 'text': '3rd Halvening', 'date': '2020-05-11' } ]
const labels = {"y": "Amount"}
const dataType = dataTypeFloat
const unit = "BTC"

var yValue = (d => d.y);
var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])

const chartFunction = lineWithAreaChart
