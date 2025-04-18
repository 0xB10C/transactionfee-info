// TODO: annoation annotationChinaMiningBan
// TODO: average line
// TODO: expected line
const MOVING_AVERAGE_DAYS = 7
const NAME = "block time"
const PRECISION = 2
let START_DATE =  new Date("2017");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/block_count_sum.csv"),
]

function preprocess(input) {
  const minutes_per_day = 24 * 60
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const blocks_per_day = parseFloat(input[1][i].block_count_sum)
    const y = minutes_per_day / blocks_per_day
    data.y.push(y)
  }
  return data
}

function chartDefinition(d) {
  return lineChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE)
}