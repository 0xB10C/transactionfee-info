const ANNOTATIONS = [annotationInscriptionsHype]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_7D
const NAME = "UTXO set size (count)"
const PRECISION = 0
let START_DATE =  new Date("2013");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_sum.csv"),
  fetchCSV("/csv/outputs_sum.csv"),
  fetchCSV("/csv/outputs_opreturn_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  let utxos = 0;
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    utxos += parseFloat(input[2][i].outputs_sum)
    utxos -= parseFloat(input[3][i].outputs_opreturn_sum)
    utxos -= parseFloat(input[1][i].inputs_sum)
    // FIXME: Why do the number of UTXOs is sometimes negative?
    if (utxos < 0) {
      utxos = 0;
    }
    const y = utxos
    data.y.push(y)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  let option = lineChart(d, NAME, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
  option.tooltip["valueFormatter"] = (v) => formatWithSIPrefix(v, "")
  option.yAxis.axisLabel = {formatter: (v) => formatWithSIPrefix(v, "")}
  return option
}