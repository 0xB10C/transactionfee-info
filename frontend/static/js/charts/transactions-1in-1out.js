const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/tx_1_input_1_output_sum.csv"),
  d3.csv("/csv/transactions_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y = parseFloat(data[1][i].tx_1_input_1_output_sum) / parseFloat(data[2][i].transactions_sum)
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = []
const labels = {"y": "one Input and one Output"}
const dataType = dataTypePercentage
const unit = ""

var yDomain = (_ => [0, 1])
yAxis.tickFormat(d3.format("~p"));

const chartFunction = lineWithAreaChart
