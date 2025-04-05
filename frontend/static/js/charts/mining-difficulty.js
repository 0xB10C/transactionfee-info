const chartRollingAverage = 1

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/difficulty_avg.csv"),
]

function preprocess(data) {
  let combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y = parseFloat(data[1][i].difficulty_avg)
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = [annotationChinaMiningBan]
const labels = {"y": "difficulty"}
const dataType = dataTypeMetric
const unit = ""

var yValue = (d => d.y);
var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])
const chartFunction = lineWithAreaChart
const startDate = d3.timeParse("%Y-%m-%d")("2017-07-01")
