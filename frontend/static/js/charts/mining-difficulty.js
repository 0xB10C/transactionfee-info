const ANNOTATIONS = [annotationChinaMiningBan]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_7D
const NAME = "hashrate"
const PRECISION = 0
let START_DATE =  new Date("2009-01-01");
const UNIT = ""

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/difficulty_avg.csv"),
]

function preprocess(input) {
  const twoToThe32 = 2 ** 32;
  const minutes_per_day = 24 * 60
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const difficulty = parseFloat(input[1][i].difficulty_avg)
    data.y.push(difficulty)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  const EXTRA = {
    tooltip: { valueFormatter: (v) => formatWithSIPrefix(v, UNIT)},
    yAxis: { axisLabel: {formatter: (v) => formatWithSIPrefix(v, UNIT) } },
  }
  let option = lineChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
  return {...option, ...EXTRA};
}