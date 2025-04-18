const MOVING_AVERAGE_DAYS = 7
const NAME = "Outputs"
const PRECISION = 2
let START_DATE =  new Date("2016");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/outputs_sum.csv"),
  fetchCSV("/csv/transactions_sum.csv")
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const y = input[1][i].outputs_sum / input[2][i].transactions_sum
    data.y.push(y)
  }
  return data
}

function chartDefinition(d) {
  return lineChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE)
}