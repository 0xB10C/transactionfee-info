const ANNOTATIONS = [annotationBitcoinCorev0_17, annotationBitcoinCorev0_9, annotationBitcoinCorev0_11_1]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_31D
const NAMES = ["low r & low S", "high r & high S", "low r & high S", "high r & low S"]
const PRECISION = 1
let START_DATE =  new Date("2011");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/sigs_ecdsa_low_rs_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_high_rs_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_low_r_high_s_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_high_r_low_s_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: [], y5: [], y6: [], y7: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const LowRS = parseFloat(input[1][i].sigs_ecdsa_low_rs_sum)
    const HighRS = parseFloat(input[2][i].sigs_ecdsa_high_rs_sum)
    const LowRHighS = parseFloat(input[3][i].sigs_ecdsa_low_r_high_s_sum)
    const HighRLowS = parseFloat(input[4][i].sigs_ecdsa_high_r_low_s_sum)

    const total = LowRS + HighRS + LowRHighS + HighRLowS

    const LowRS_percentage = LowRS / total || 0
    const HighRS_percentage = HighRS / total || 0
    const LowRHighS_percentage = LowRHighS / total || 0
    const HighRLowS_percentage = HighRLowS / total || 0
    
    data.y1.push(LowRS_percentage * 100)
    data.y2.push(HighRS_percentage * 100)
    data.y3.push(LowRHighS_percentage * 100)
    data.y4.push(HighRLowS_percentage * 100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  const DATA_KEYS = ["y1", "y2", "y3", "y4"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}