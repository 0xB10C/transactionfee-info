// TODO: annotationChinaMiningBan
const MOVING_AVERAGE_DAYS = 7
const NAME = "PoW-equivalent days"
const PRECISION = 0
let START_DATE =  new Date("2017");
const UNIT = "days"

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/log2_work_avg.csv"),
  fetchCSV("/csv/block_count_sum.csv"),
  fetchCSV("/csv/difficulty_avg.csv"),
]

function preprocess(input) {
  const twoToThe32 = 2 ** 32;
  const minutes_per_day = 24 * 60
  const seconds_per_day = 24 * 60 * 60
  let cumulative_work = 0n
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const log2_work = parseFloat(input[1][i].log2_work_avg)
    const blocks_per_day = parseFloat(input[2][i].block_count_sum)
    cumulative_work += BigInt(Math.round(2 ** log2_work) * blocks_per_day)
    const difficulty = parseFloat(input[3][i].difficulty_avg)
    const block_time_minutes = minutes_per_day / blocks_per_day
    const block_time_seconds = block_time_minutes * 60
    const hashrate = Math.trunc((twoToThe32 * difficulty) / block_time_seconds)
    const y = Number(cumulative_work) / hashrate / seconds_per_day
    data.y.push(y)
  }
  return data
}

function chartDefinition(d) {
  return lineChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE)
}