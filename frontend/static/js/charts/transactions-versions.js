const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/tx_version_1_sum.csv"),
  d3.csv("/csv/tx_version_2_sum.csv"),
  d3.csv("/csv/tx_version_3_sum.csv"),
  d3.csv("/csv/tx_version_unknown_sum.csv"),
  d3.csv("/csv/transactions_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const txs_sum = parseFloat(data[5][i].transactions_sum)
    const txs_v1_percentage = parseFloat(data[1][i].tx_version_1_sum) / txs_sum || 0
    const txs_v2_percentage = parseFloat(data[2][i].tx_version_2_sum) / txs_sum || 0
    const txs_v3_percentage = parseFloat(data[3][i].tx_version_3_sum) / txs_sum || 0
    const txs_unknown_percentage = parseFloat(data[4][i].tx_version_unknown_sum) / txs_sum || 0
    combinedData.push({date, txs_v1_percentage, txs_v2_percentage, txs_v3_percentage, txs_unknown_percentage})
  }

  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2016-04-01")
const annotations = [{'text': 'BIP-68 Activation', 'date': '2016-07-04'}]
const keys = ["txs_v1_percentage", "txs_v2_percentage", "txs_v3_percentage", "txs_unknown_percentage"]
const colors = {"txs_v1_percentage": colorBLUE,  "txs_v2_percentage": colorYELLOW, "txs_v3_percentage": colorORANGE, "txs_unknown_percentage": colorGRAY}
const labels = {"txs_v1_percentage": "Version 1",  "txs_v2_percentage": "Version 2", "txs_v3_percentage": "Version 3", "txs_unknown_percentage": "Version Unknown"}
const dataType = dataTypePercentage
const unit = ""

const chartFunction = stackedAreaChart
