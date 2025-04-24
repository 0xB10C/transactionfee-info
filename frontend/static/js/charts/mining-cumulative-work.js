const ANNOTATIONS = [annotationChinaMiningBan, annotationASICsAvaliable, annotationGPUMinerAvaliable]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_1D
const NAME = "cumulative work"
const PRECISION = 2
let START_DATE =  new Date("2009-01-01");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/log2_work_avg.csv"),
  fetchCSV("/csv/block_count_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  let cumulative_work = 0n
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const log2_work = parseFloat(input[1][i].log2_work_avg)
    const blocks_per_day = parseFloat(input[2][i].block_count_sum)
    cumulative_work += BigInt(Math.round(2 ** log2_work) * blocks_per_day)
    const y = Number(cumulative_work);
    data.y.push(y)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  return lineChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}