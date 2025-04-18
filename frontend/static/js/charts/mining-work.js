// TODO: annotationChinaMiningBan
const MOVING_AVERAGE_DAYS = 1
const NAME = "work"
const PRECISION = 0
let START_DATE =  new Date("2009-01-01");
const UNIT = "H"

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/log2_work_avg.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const log2_work = parseFloat(input[1][i].log2_work_avg)
    const y = 2 ** log2_work;
    data.y.push(y)
  }
  return data
}

function chartDefinition(d) {
  const EXTRA = {
    tooltip: { valueFormatter: (v) => formatWithSIPrefix(v, UNIT)},
    yAxis: { axisLabel: {formatter: (v) => formatWithSIPrefix(v, UNIT) } },
  }
  let option = lineChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE);
  return {...option, ...EXTRA};
}


