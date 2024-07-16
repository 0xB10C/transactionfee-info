const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/tx_spending_taproot_sum.csv"),
  d3.csv("/csv/transactions_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y = parseFloat(data[1][i].tx_spending_taproot_sum) / parseFloat(data[2][i].transactions_sum)
    combinedData.push({date, y})
  }
  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")(annotationTaprootLockedIn.date) - DAYS31
const annotations = [annotationTaprootLockedIn, annotationTaprootActivated, annotationBitcoinCore23]
const labels = {"y": "spending Taproot"}
const dataType = dataTypePercentagePrecise
const unit = ""

var yDomain = (_ => [0, 1])
yAxis.tickFormat(d3.format("~p"));

const chartFunction = lineWithAreaChart
