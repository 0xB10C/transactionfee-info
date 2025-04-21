const ANNOTATIONS = [annotationBitcoinCorev0_9, annotationBitcoinCorev0_11_1, annotationBitcoinCorev0_17]
const MOVING_AVERAGE_DAYS = 31
const NAMES = ["Uncompressed (input)", "Compressed (input)", "Compressed (output)", "Uncompressed (output)"]
const PRECISION = 1
let START_DATE =  new Date("2009");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/pubkeys_uncompressed_inputs_sum.csv"),
  fetchCSV("/csv/pubkeys_compressed_inputs_sum.csv"),
  fetchCSV("/csv/pubkeys_uncompressed_outputs_sum.csv"),
  fetchCSV("/csv/pubkeys_compressed_outputs_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: [], y5: [], y6: [], y7: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const uncompressed_in = parseFloat(input[1][i].pubkeys_uncompressed_inputs_sum)
    const compressed_in = parseFloat(input[2][i].pubkeys_compressed_inputs_sum)
    const uncompressed_out = parseFloat(input[3][i].pubkeys_uncompressed_outputs_sum)
    const compressed_out = parseFloat(input[4][i].pubkeys_compressed_outputs_sum)

    const total = uncompressed_in + compressed_in + uncompressed_out + compressed_out

    const uncompressed_percentage_in = uncompressed_in / total || 0
    const compressed_percentage_in = compressed_in / total || 0
    const compressed_percentage_out = compressed_out / total || 0
    const uncompressed_percentage_out = uncompressed_out / total || 0
    
    data.y1.push(uncompressed_percentage_in * 100)
    data.y2.push(compressed_percentage_in * 100)
    data.y3.push(compressed_percentage_out * 100)
    data.y4.push(uncompressed_percentage_out * 100)
  }
  return data
}

function chartDefinition(d) {
  const DATA_KEYS = ["y1", "y2", "y3", "y4"]
  return stackedAreaPercentageChart(d, DATA_KEYS, NAMES, MOVING_AVERAGE_DAYS, PRECISION, START_DATE, ANNOTATIONS);
}