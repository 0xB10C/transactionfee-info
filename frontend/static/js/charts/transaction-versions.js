const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/TxsVersion1_sum.csv"),
  d3.csv("/csv/TxsVersion2_sum.csv"),
  d3.csv("/csv/Transactions_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const txs_sum = parseFloat(data[3][i].Transactions_sum)
    const txs_v1_percentage = parseFloat(data[1][i].TxsVersion1_sum) / txs_sum
    const txs_v2_percentage = parseFloat(data[2][i].TxsVersion2_sum) / txs_sum
    combinedData.push({date, txs_v1_percentage, txs_v2_percentage})
  }
  
  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2016-04-01")
const annotations = [{'text': 'BIP-68 Activation', 'date': '2016-07-04'}]
const keys = ["txs_v1_percentage", "txs_v2_percentage"]
const colors = {"txs_v1_percentage": colorBLUE,  "txs_v2_percentage": colorYELLOW}
const labels = {"txs_v1_percentage": "Version 1",  "txs_v2_percentage": "Version 2"}
const dataType = dataTypePercentage
const unit = ""

const chartFunction = stackedAreaChart
