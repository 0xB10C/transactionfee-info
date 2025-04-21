const ANNOTATIONS = [annotationSegWitActivated]
const MOVING_AVERAGE_DAYS = 31
const NAMES = ["P2MS", "P2SH", "nested P2WSH", "P2WSH"]
const PRECISION = 1
let START_DATE =  new Date("2017-08");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_spending_p2ms_multisig_sum.csv"),
  fetchCSV("/csv/inputs_spending_p2sh_multisig_sum.csv"),
  fetchCSV("/csv/inputs_spending_nested_p2wsh_multisig_sum.csv"),
  fetchCSV("/csv/inputs_spending_p2wsh_multisig_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))

    const ms_P2MS = parseFloat(input[1][i].inputs_spending_p2ms_multisig_sum)
    const ms_P2SH = parseFloat(input[2][i].inputs_spending_p2sh_multisig_sum)
    const ms_Nested_P2WSH = parseFloat(input[3][i].inputs_spending_nested_p2wsh_multisig_sum)
    const ms_P2WSH = parseFloat(input[4][i].inputs_spending_p2wsh_multisig_sum)

    const total = ms_P2MS + ms_P2SH + ms_Nested_P2WSH + ms_P2WSH

    const ms_P2MS_percentage = ms_P2MS / total || 0
    const ms_P2SH_percentage = ms_P2SH / total || 0
    const ms_Nested_P2WSH_percentage = ms_Nested_P2WSH / total || 0
    const ms_P2WSH_percentage = ms_P2WSH / total || 0
    
    data.y1.push(ms_P2MS_percentage * 100)
    data.y2.push(ms_P2SH_percentage * 100)
    data.y3.push(ms_Nested_P2WSH_percentage * 100)
    data.y4.push(ms_P2WSH_percentage * 100)
  }
  return data
}

function chartDefinition(d) {
  const DATA_KEYS = ["y1", "y2", "y3", "y4"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, MOVING_AVERAGE_DAYS, PRECISION, START_DATE, ANNOTATIONS);
}