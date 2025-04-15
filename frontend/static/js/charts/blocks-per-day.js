const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = 7
const NAME = "blocks per day"
const PRECISION = 0
let START_DATE =  new Date();
START_DATE.setFullYear(new Date().getFullYear() - 5);

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/block_count_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    data.y.push(parseFloat(input[1][i].block_count_sum))
  }
  return data
}

function chartDefinition(d) {
  let option = lineChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE, ANNOTATIONS);
  option.series.push(
    // Annotations:
    { type: "line", markLine: { symbol: "none", lineStyle: { color:"gray", type: "dotted" }, data: [{ name: "144", yAxis: 144, label: { formatter: "144 blocks" } }] } },
  )
  return option;
}