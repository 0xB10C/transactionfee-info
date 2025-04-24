const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_7D
const NAME = "BTC in OP_RETURN"
const PRECISION = 8
let START_DATE =  new Date("2013-01-01");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/outputs_opreturn_amount_sum.csv"),
]

function preprocess(input) {
  cumulativeValue = 0
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    cumulativeValue += parseFloat(input[1][i].outputs_opreturn_amount_sum)
    data.y.push(cumulativeValue/ 100_000_000)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  return lineChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}
