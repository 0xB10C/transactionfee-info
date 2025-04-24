const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_7D
const NAME = "ViaBTC share"
const PRECISION = 2
// set to the first date we have data for
let START_DATE =  undefined

const CSVs = [
  // ID from https://github.com/bitcoin-data/mining-pools/blob/generated/pool-list.json
  fetchCSV("/csv/miningpools-poolid-110.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    const date = new Date(input[0][i].date)
    if (START_DATE === undefined) {
      START_DATE = date
    }
    const y = parseFloat(input[0][i].count / input[0][i].total)
    data.date.push(+(date))
    data.y.push(y*100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  return areaPercentageChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}