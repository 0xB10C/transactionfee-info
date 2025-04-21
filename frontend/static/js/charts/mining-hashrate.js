const ANNOTATIONS = [annotationChinaMiningBan]
const MOVING_AVERAGE_DAYS = 7
const NAME = "hashrate"
const PRECISION = 0
let START_DATE =  new Date("2009-01-01");
const UNIT = "H/s"

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/block_count_sum.csv"),
  fetchCSV("/csv/difficulty_avg.csv"),
]

function preprocess(input) {
  const twoToThe32 = 2 ** 32;
  const minutes_per_day = 24 * 60
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const blocks_per_day = parseFloat(input[1][i].block_count_sum)
    const difficulty = parseFloat(input[2][i].difficulty_avg)
    const block_time_minutes = minutes_per_day / blocks_per_day
    const block_time_seconds = block_time_minutes * 60
    const hashrate = Math.trunc((twoToThe32 * difficulty) / block_time_seconds)
    const y = hashrate
    data.y.push(y)
  }
  return data
}

function chartDefinition(d) {
  const EXTRA = {
    tooltip: { valueFormatter: (v) => formatWithSIPrefix(v, UNIT)},
    yAxis: { axisLabel: {formatter: (v) => formatWithSIPrefix(v, UNIT) } },
  }
  let option = lineChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE, ANNOTATIONS);
  return {...option, ...EXTRA};
}