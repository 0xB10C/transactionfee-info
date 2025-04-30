const ANNOTATIONS = [annotationInscriptionsHype]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_31D
const NAME = "Transactions per block"
const PRECISION = 0
let START_DATE =  new Date("2013");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/transactions_avg.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    data.y.push(parseFloat(input[1][i].transactions_avg))
  }
  return data
}

function chartDefinition(d, movingAverage) {
  return lineChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}