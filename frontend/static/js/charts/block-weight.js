const ANNOTATIONS = [annotationSegWitActivated, annotationInscriptionsHype, annotationRunestones]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_7D
const NAME = "block weight"
const PRECISION = 0
const UNIT = "WU"
let START_DATE =  new Date("2017");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/weight_avg.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    data.y.push(parseFloat(input[1][i].weight_avg))
  }
  return data
}

function chartDefinition(d, movingAverage) {
  let option = lineChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
  option.tooltip["valueFormatter"] = (v) => v + " " + UNIT
  option.yAxis.axisLabel = {formatter: (v) => formatWithSIPrefix(v, UNIT)}
  return option
}