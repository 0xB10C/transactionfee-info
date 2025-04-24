const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_7D
const NAME = "one Input"
const PRECISION = 2
let START_DATE =  new Date();
START_DATE.setFullYear(new Date().getFullYear() - 3);

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/tx_1_input_sum.csv"),
  fetchCSV("/csv/transactions_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    const date = new Date(input[0][i].date)
    const y =  parseFloat(input[1][i].tx_1_input_sum) / parseFloat(input[2][i].transactions_sum)
    data.date.push(+(date))
    data.y.push(y*100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  return areaPercentageChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}