const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/inputs_sum.csv"),
  d3.csv("/csv/outputs_sum.csv"),
  d3.csv("/csv/outputs_opreturn_sum.csv"),
]

function preprocess(data) {
  let combinedData = []
  let utxos = 0
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    utxos += parseFloat(data[2][i].outputs_sum)
    utxos -= parseFloat(data[3][i].outputs_opreturn_sum)
    utxos -= parseFloat(data[1][i].inputs_sum)
    const y = utxos
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = []
const labels = {"y": "UTXO set size (count)"}
const dataType = dataTypeMetric
yAxis.tickFormat(d3.format("~s"));
const unit = ""

var yValue = (d => d.y);
var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])
const chartFunction = lineWithAreaChart
const startDate = d3.timeParse("%Y-%m-%d")("2017-07-01")
