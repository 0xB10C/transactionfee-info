const MOVING_AVERAGE_DAYS = 7
const NAME = "inputs per transaction"
const PRECISION = 2
let START_DATE =  new Date();
START_DATE.setFullYear(new Date().getFullYear() - 3);

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_sum.csv"),
  fetchCSV("/csv/transactions_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const y = parseFloat(input[2][i].transactions_sum) / parseFloat(input[1][i].inputs_sum) || 0
    data.y.push(y*100)
  }
  return data
}

function chartDefinition(d) {
  return areaPercentageChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE)
}