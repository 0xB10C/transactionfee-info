const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = 7
const NAME = "AntPool & friends share"
const PRECISION = 2

// We don't know for sure when the smaller pools joined "AntPool & Friends".
// We assume this started sometime in mid 2022. Ignore all data before that
// date.
const ANTPOOL_FRIENDS_START_DATE = new Date(Date.parse("2022-07-01"));

// set to the first date we have data for
let START_DATE =  ANTPOOL_FRIENDS_START_DATE


const CSVs = [
  // ID from https://github.com/bitcoin-data/mining-pools/blob/generated/pool-list.json
  fetchCSV("/csv/miningpools-antpool-and-friends.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    const date = new Date(input[0][i].date)
    if (date < ANTPOOL_FRIENDS_START_DATE) {
      continue
    }
    const y = parseFloat(input[0][i]["AntPool & friends"] / input[0][i].total)
    data.date.push(+(date))
    data.y.push(y*100)
  }
  return data
}

function chartDefinition(d) {
  return areaPercentageChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE, ANNOTATIONS);
}