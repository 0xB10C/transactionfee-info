const MOVING_AVERAGE_DAYS = 7
const NAME = "RBF signaling"
const PRECISION = 2
let START_DATE =  new Date("2016");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/payments_sum.csv"),
  fetchCSV("/csv/payments_signaling_explicit_rbf_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    const date = new Date(input[0][i].date)
    const y =  parseFloat(input[2][i].payments_signaling_explicit_rbf_sum) / parseFloat(input[1][i].payments_sum) || 0
    data.date.push(+(date))
    data.y.push(y*100)
  }
  return data
}

function chartDefinition(d) {
  return areaPercentageChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE)
}