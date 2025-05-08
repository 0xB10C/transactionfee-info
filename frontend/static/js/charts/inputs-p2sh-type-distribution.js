const ANNOTATIONS = [annotationSegWitActivated]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_30D
const NAMES = ["P2SH", "nested P2WPKH", "nested P2WSH"]
const PRECISION = 1
let START_DATE =  new Date("2016");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_p2sh_sum.csv"),
  fetchCSV("/csv/inputs_nested_p2wpkh_sum.csv"),
  fetchCSV("/csv/inputs_nested_p2wsh_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))

    const P2SH = parseFloat(input[1][i].inputs_p2sh_sum)
    const NestedP2WPKH = parseFloat(input[2][i].inputs_nested_p2wpkh_sum)
    const NestedP2WSH = parseFloat(input[3][i].inputs_nested_p2wsh_sum)

    const total = P2SH + NestedP2WPKH + NestedP2WSH

    const P2SH_percentage = P2SH / total || 0
    const NestedP2WPKH_percentage = NestedP2WPKH / total || 0
    const NestedP2WSH_percentage = NestedP2WSH / total || 0

    data.y1.push(P2SH_percentage * 100)
    data.y2.push(NestedP2WPKH_percentage * 100)
    data.y3.push(NestedP2WSH_percentage * 100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  const DATA_KEYS = ["y1", "y2", "y3"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}