const ANNOTATIONS = [annotationBitcoinCorev0_9, annotationBitcoinCorev0_11_1]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_30D
const NAMES = ["low S", "high S"]
const PRECISION = 1
let START_DATE =  new Date("2011");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/sigs_ecdsa_low_s_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_high_s_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: [], y5: [], y6: [], y7: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))

    const lowS = parseFloat(input[1][i].sigs_ecdsa_low_s_sum)
    const highS = parseFloat(input[2][i].sigs_ecdsa_high_s_sum)

    const total = lowS + highS

    const lowS_percentage = lowS / total || 0
    const highS_percentage = highS / total || 0

    data.y1.push(lowS_percentage * 100)
    data.y2.push(highS_percentage * 100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  const DATA_KEYS = ["y1", "y2"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}