const MOVING_AVERAGE_DAYS = 7
const NAME = "tx spending newly created UTXOs"
const PRECISION = 2
let START_DATE =  new Date("2009");


const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_spend_in_same_block_sum.csv"),
  fetchCSV("/csv/inputs_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    const date = new Date(input[0][i].date)
    const y =  parseFloat(input[1][i].inputs_spend_in_same_block_sum) / parseFloat(input[2][i].inputs_sum)
    data.date.push(+(date))
    data.y.push(y*100)
  }
  return data
}

function chartDefinition(d) {
  return areaPercentageChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE)
}