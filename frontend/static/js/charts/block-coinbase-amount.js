const ANNOTATIONS = [
  { 'text': '1st halving', 'date': '2012-11-28' },
  { 'text': '2nd halving', 'date': '2016-07-09' },
  { 'text': '3rd halving', 'date': '2020-05-11' }, 
  { 'text': '4th halving', 'date': '2024-04-20' } 
]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_7D
const NAME = "Coinbase output value"
const PRECISION = 8
let START_DATE =  new Date("2009");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/coinbase_output_amount_avg.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const y = parseFloat(input[1][i].coinbase_output_amount_avg)
    data.y.push(y/ 100_000_000)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  return lineChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}
