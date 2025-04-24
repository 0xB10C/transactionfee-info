const ANNOTATIONS = [annotationBitcoinCorev0_9, annotationBitcoinCorev0_11_1, annotationBitcoinCorev0_17]
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_31D
const NAMES = ["<70 byte", "70 byte", "71 byte", "72 byte", "73 byte", "74 byte", "75 byte or more"]
const PRECISION = 1
let START_DATE =  new Date("2011");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_less_70byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_70byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_71byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_72byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_73byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_74byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_75byte_or_more_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: [], y5: [], y6: [], y7: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const lenLess70= parseFloat(input[1][i].sigs_ecdsa_length_less_70byte_sum)
    const len70 = parseFloat(input[2][i].sigs_ecdsa_length_70byte_sum)
    const len71 = parseFloat(input[3][i].sigs_ecdsa_length_71byte_sum)
    const len72 = parseFloat(input[4][i].sigs_ecdsa_length_72byte_sum)
    const len73 = parseFloat(input[5][i].sigs_ecdsa_length_73byte_sum)
    const len74 = parseFloat(input[6][i].sigs_ecdsa_length_74byte_sum)
    const len75 = parseFloat(input[7][i].sigs_ecdsa_length_75byte_or_more_sum)

    const total = lenLess70 + len70 + len71 + len72 + len73 + len74 + len75

    const lenLess70_percentage = lenLess70 / total || 0
    const len70_percentage = len70 / total || 0
    const len71_percentage = len71 / total || 0
    const len72_percentage = len72 / total || 0
    const len73_percentage = len73 / total || 0
    const len74_percentage = len74 / total || 0
    const len75_percentage = len75 / total || 0
    
    data.y1.push(lenLess70_percentage * 100)
    data.y2.push(len70_percentage * 100)
    data.y3.push(len71_percentage * 100)
    data.y4.push(len72_percentage * 100)
    data.y5.push(len73_percentage * 100)
    data.y6.push(len74_percentage * 100)
    data.y7.push(len75_percentage * 100)
  }
  return data
}

function chartDefinition(d, movingAverage) {
  const DATA_KEYS = ["y1", "y2", "y3", "y4", "y5", "y6", "y7"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, movingAverage, PRECISION, START_DATE, ANNOTATIONS);
}