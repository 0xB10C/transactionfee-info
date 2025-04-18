// start date annotationSegWitActivated
// annotation annotationSegWitActivated
const MOVING_AVERAGE_DAYS = 7
const NAME = "nested P2WPKH inputs"
const PRECISION = 0
let START_DATE =  new Date();
START_DATE.setFullYear(new Date().getFullYear() - 3);

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_nested_p2wpkh_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    data.y.push(parseFloat(input[1][i].inputs_nested_p2wpkh_sum))
  }
  return data
}

function chartDefinition(d) {
  return lineChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE)
}