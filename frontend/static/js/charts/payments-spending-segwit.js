const ANNOTATIONS = [annotationSegWitActivated]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_7D
const NAME = "Payments spending SegWit"
const PRECISION = 2
let START_DATE =  new Date("2017");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/payments_sum.csv"),
  fetchCSV("/csv/payments_segwit_spending_tx_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const y = parseFloat(input[2][i].payments_segwit_spending_tx_sum) / parseFloat(input[1][i].payments_sum)
    data.y.push(y * 100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  return areaPercentageChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS)
}
