const ANNOTATIONS = [annotationBIP66Activated]
const MOVING_AVERAGE_DAYS = 31
const NAMES = ["DER encoded", "not DER encoded"]
const PRECISION = 1
let START_DATE =  new Date("2011");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/sigs_ecdsa_strict_der_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_not_strict_der_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: [], y5: [], y6: [], y7: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))

    const strict = parseFloat(input[1][i].sigs_ecdsa_strict_der_sum)
    const notStrict = parseFloat(input[2][i].sigs_ecdsa_not_strict_der_sum)

    const total = strict + notStrict

    const strict_percentage = strict / total || 0
    const notStrict_percentage = notStrict / total || 0

    data.y1.push(strict_percentage * 100)
    data.y2.push(notStrict_percentage * 100)
  }
  return data
}

function chartDefinition(d) {
  const DATA_KEYS = ["y1", "y2"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, MOVING_AVERAGE_DAYS, PRECISION, START_DATE, ANNOTATIONS);
}