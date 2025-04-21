const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = 7
const NAMES = ["vsize", "size"]
const PRECISION = 0
let START_DATE =  new Date();
START_DATE.setFullYear(new Date().getFullYear() - 5);

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/size_sum.csv"), // block size
  fetchCSV("/csv/vsize_sum.csv"), // block vsize
  fetchCSV("/csv/transactions_sum.csv")
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const tx_per_day = parseFloat(input[3][i].transactions_sum)
    const y1 = parseFloat(input[2][i].vsize_sum) / tx_per_day || 0
    const y2 = parseFloat(input[1][i].size_sum) / tx_per_day || 0
    data.y1.push(y1)
    data.y2.push(y2)
  }
  return data
}

function chartDefinition(d) {
  return doubleLineChart(d, NAMES, MOVING_AVERAGE_DAYS, PRECISION, START_DATE, ANNOTATIONS);
}