const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/Payments_sum.csv"),
  d3.csv("/csv/PaymentsSegWitSpendingTx_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y =  parseFloat(data[2][i].PaymentsSegWitSpendingTx_sum) / parseFloat(data[1][i].Payments_sum)
    combinedData.push({date, y})
  }
  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")(annotationSegWitActivated.date) - DAYS31
const annotations = [annotationSegWitActivated, annotationBitcoinCoreSegWitWalletReleased, annotationBlockchainComSegwit]
const labels = {"y": "spending SegWit"}
const dataType = dataTypePercentage
const unit = ""
const chartFunction = lineWithAreaChart

var yDomain = (_ => [0, 1])
yAxis.tickFormat(d3.format("~p"));
