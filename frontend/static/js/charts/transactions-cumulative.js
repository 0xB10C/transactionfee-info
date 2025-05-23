
const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_1D
const NAME = "Transactions (cumulative)"
const PRECISION = 0
let START_DATE =  new Date("2013");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/transactions_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  let cumulative = 0;
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    cumulative += parseFloat(input[1][i].transactions_sum)
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