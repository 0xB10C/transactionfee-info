const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/TxsLocktimeNotEnforced_sum.csv"),
  d3.csv("/csv/Transactions_sum.csv"),
  d3.csv("/csv/TxsLocktimeBlockHeight_sum.csv"),
  d3.csv("/csv/TxsLocktimeTimestamp_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const not_enforced = parseFloat(data[1][i].TxsLocktimeNotEnforced_sum)
    const all_tx = parseFloat(data[2][i].Transactions_sum)
    const timelocked = parseFloat(data[3][i].TxsLocktimeBlockHeight_sum) + parseFloat(data[4][i].TxsLocktimeTimestamp_sum)
    const y = (not_enforced/all_tx)
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = []
const labels = {"y": "unenforced locktimes"}
const dataType = dataTypePercentage
const unit = ""

var yValue = (d => d.y);
var yDomain = (data => [0, 1])
yAxis.tickFormat(d3.format("~p"));

const chartFunction = lineWithAreaChart
