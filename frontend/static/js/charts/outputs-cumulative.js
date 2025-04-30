
const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_1D
const NAME = "Outputs (cumulative)"
const PRECISION = 0
let START_DATE =  new Date("2013");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/outputs_sum.csv"),
]

function preprocess(input) {
  let cumulative = 0;
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    cumulative += parseFloat(input[1][i].outputs_sum)
    data.y.push(cumulative)
  }
  return data
}

function chartDefinition(d, movingAverage) {
    const EXTRA = {
    yAxis: { axisLabel: {formatter: (v) => formatWithSIPrefix(v, "")} },
    }
    let option = lineChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
    return {...option, ...EXTRA};
}