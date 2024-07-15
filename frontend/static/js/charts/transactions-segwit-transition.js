const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/TxsNotSpendingSegWit_sum.csv"),
  d3.csv("/csv/TxsOnlySpendingSegWit_sum.csv"),
  d3.csv("/csv/TxsSpendingSegWitAndLegacy_sum.csv"),
  d3.csv("/csv/Transactions_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const legacyOnly = parseFloat(data[1][i].TxsNotSpendingSegWit_sum)
    const segwitOnly = parseFloat(data[2][i].TxsOnlySpendingSegWit_sum)
    const mixed = parseFloat(data[3][i].TxsSpendingSegWitAndLegacy_sum)
    const total = parseFloat(data[4][i].Transactions_sum)

    const legacyOnly_percentage = legacyOnly / total || 0
    const segwitOnly_percentage = segwitOnly / total || 0
    const mixed_percentage = mixed / total || 0

    combinedData.push({date, legacyOnly_percentage, segwitOnly_percentage, mixed_percentage})
  }

  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")(annotationSegWitActivated.date) - (DAYS31*12)
const annotations = [annotationSegWitActivated, annotationBitcoinCoreSegWitWalletReleased]
const keys = ["legacyOnly_percentage", "mixed_percentage", "segwitOnly_percentage"]
const colors = {"legacyOnly_percentage": colorP2WSH, "segwitOnly_percentage": colorP2WPKH, "mixed_percentage": colorNestedP2WSH}
const labels = {"legacyOnly_percentage": "only legacy inputs", "segwitOnly_percentage": "only SegWit inputs", "mixed_percentage": "both legacy and SegWit inputs"}
const dataType = dataTypePercentage
const unit = ""

const chartFunction = stackedAreaChart
