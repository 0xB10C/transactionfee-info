const ANNOTATIONS = [annotationBitcoinCorev0_17]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_31D
const NAMES = ["low r", "high r"]
const PRECISION = 1
let START_DATE =  new Date("2011");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/sigs_ecdsa_low_r_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_high_r_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: [], y5: [], y6: [], y7: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))

    const lowR = parseFloat(input[1][i].sigs_ecdsa_low_r_sum)
    const highR = parseFloat(input[2][i].sigs_ecdsa_high_r_sum)

    const total = lowR + highR

    const lowR_percentage = lowR / total || 0
    const highR_percentage = highR / total || 0

    data.y1.push(lowR_percentage * 100)
    data.y2.push(highR_percentage * 100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  const DATA_KEYS = ["y1", "y2"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}