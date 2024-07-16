const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/inputs_spend_in_same_block_sum.csv"),
  d3.csv("/csv/inputs_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y =  parseFloat(data[1][i].inputs_spend_in_same_block_sum) / parseFloat(data[2][i].inputs_sum)
    combinedData.push({date, y})
  }
  return combinedData
}

const annotations = []
const labels = {"y": "spending newly created UTXOs"}
const dataType = dataTypePercentage
const unit = ""
const chartFunction = lineWithAreaChart

var yDomain = (_ => [0, 1])
yAxis.tickFormat(d3.format("~p"));
