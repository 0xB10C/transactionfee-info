const ANNOTATIONS = [{'text': 'BIP-68 Activation', 'date': '2016-07-04'}]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_31D
const NAMES = ["v1", "v2", "v3", "unknown version"]
const PRECISION = 1
let START_DATE =  new Date("2016");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/tx_version_1_sum.csv"),
  fetchCSV("/csv/tx_version_2_sum.csv"),
  fetchCSV("/csv/tx_version_3_sum.csv"),
  fetchCSV("/csv/tx_version_unknown_sum.csv"),
  fetchCSV("/csv/transactions_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], v1: [], v2: [], v3: [], version_unknown: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const txs_sum = parseFloat(input[5][i].transactions_sum)
    const v1 = parseFloat(input[1][i].tx_version_1_sum) / txs_sum || 0
    const v2 = parseFloat(input[2][i].tx_version_2_sum) / txs_sum || 0
    const v3 = parseFloat(input[3][i].tx_version_3_sum) / txs_sum || 0
    const version_unknown = parseFloat(input[4][i].tx_version_unknown_sum) / txs_sum || 0
    data.v1.push(v1 * 100)
    data.v2.push(v2 * 100)
    data.v3.push(v3 * 100)
    data.version_unknown.push(version_unknown * 100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  const DATA_KEYS = ["v1", "v2", "v3", "version_unknown"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}