const chartRollingAverage = 1

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/transactions_sum.csv"),
  d3.csv("/csv/tx_timelock_timestamp_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y =  parseFloat(data[2][i].tx_timelock_timestamp_sum) / parseFloat(data[1][i].transactions_sum)
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = []
const labels = {"y": "lock-by-block-time"}
const dataType = dataTypePercentagePrecise
const unit = ""

var yDomain = (_ => [0, 0.005]) // FIXME: custom range
yAxis.tickFormat(d3.format("~p"));

const chartFunction = lineWithAreaChart
