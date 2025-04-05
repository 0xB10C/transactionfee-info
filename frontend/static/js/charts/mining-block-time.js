const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/inputs_coinbase_sum.csv"),
  d3.csv("/csv/inputs_witness_coinbase_sum.csv"),
]

function preprocess(data) {
  let combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const blocks_per_day = (parseFloat(data[1][i].inputs_coinbase_sum) + parseFloat(data[2][i].inputs_witness_coinbase_sum))
    const minutes_per_day = 24 * 60
    const y = minutes_per_day / blocks_per_day
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = [annotationChinaMiningBan]
const labels = {"y": "Block Time"}
const dataType = dataTypeFloatMinutes
const unit = "min"
const startDate = d3.timeParse("%Y-%m-%d")("2017-07-01")
var yValue = (d => d.y);
var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])

const chartFunction = lineWithAreaChart
