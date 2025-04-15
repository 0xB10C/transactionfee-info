const ANNOTATIONS = [annotationTaprootActivated, annotationInscriptionsHype]
const MOVING_AVERAGE_DAYS = 7
const NAME = "P2TR outputs"
const PRECISION = 0
let START_DATE =  new Date();
START_DATE.setFullYear(new Date().getFullYear() - 3);

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/outputs_p2tr_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    data.y.push(parseFloat(input[1][i].outputs_p2tr_sum))
  }
  return data
}

function chartDefinition(d) {
  return lineChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE, ANNOTATIONS);
}