const ANNOTATIONS = [annotationSegWitActivated, annotationBitcoinCoreSegWitWalletReleased]
const MOVING_AVERAGE_DAYS = 31
const NAMES = ["legacy only", "mixed", "SegWit only"]
const PRECISION = 1
let START_DATE =  new Date("2017");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/tx_spending_only_legacy_sum.csv"),
  fetchCSV("/csv/tx_spending_only_segwit_sum.csv"),
  fetchCSV("/csv/tx_spending_segwit_and_legacy_sum.csv"),
  fetchCSV("/csv/transactions_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const legacyOnly = parseFloat(input[1][i].tx_spending_only_legacy_sum)
    const segwitOnly = parseFloat(input[2][i].tx_spending_only_segwit_sum)
    const mixed = parseFloat(input[3][i].tx_spending_segwit_and_legacy_sum)
    const total = parseFloat(input[4][i].transactions_sum)
    const y1 = legacyOnly / total || 0
    const y2 = mixed / total || 0
    const y3 = segwitOnly / total || 0
    data.y1.push(y1 * 100)
    data.y2.push(y2 * 100)
    data.y3.push(y3 * 100)
  }
  return data
}

function chartDefinition(d) {
  const DATA_KEYS = ["y1", "y2", "y3"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, MOVING_AVERAGE_DAYS, PRECISION, START_DATE, ANNOTATIONS);
}