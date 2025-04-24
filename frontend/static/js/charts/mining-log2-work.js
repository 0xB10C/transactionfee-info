const ANNOTATIONS = [annotationChinaMiningBan]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_1D
const NAME = "log2(work)"
const PRECISION = 2
let START_DATE =  new Date("2009-01-01");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/log2_work_avg.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const log2_work = parseFloat(input[1][i].log2_work_avg)
    data.y.push(log2_work)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  return lineChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}