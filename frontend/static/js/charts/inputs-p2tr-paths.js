const ANNOTATIONS = [annotationBitcoinCore23, annotationTaprootActivated]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_31D
const NAMES = ["key-path", "script-path"]
const PRECISION = 1
let START_DATE =  new Date("2021-11");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_p2tr_keypath_sum.csv"),
  fetchCSV("/csv/inputs_p2tr_scriptpath_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const key = parseFloat(input[1][i].inputs_p2tr_keypath_sum)
    const script = parseFloat(input[2][i].inputs_p2tr_scriptpath_sum)
    const sum = key + script

    let key_percentage = key / sum || 0
    let script_percentage = script / sum || 0

    data.y1.push(key_percentage * 100)
    data.y2.push(script_percentage * 100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  const DATA_KEYS = ["y1", "y2"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}