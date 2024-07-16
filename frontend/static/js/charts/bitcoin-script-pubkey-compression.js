const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/pubkeys_uncompressed_inputs_sum.csv"),
  d3.csv("/csv/pubkeys_compressed_inputs_sum.csv"),
  d3.csv("/csv/pubkeys_uncompressed_outputs_sum.csv"),
  d3.csv("/csv/pubkeys_compressed_outputs_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const uncompressed_in = parseFloat(data[1][i].pubkeys_uncompressed_inputs_sum)
    const compressed_in = parseFloat(data[2][i].pubkeys_compressed_inputs_sum)
    const uncompressed_out = parseFloat(data[3][i].pubkeys_uncompressed_outputs_sum)
    const compressed_out = parseFloat(data[4][i].pubkeys_compressed_outputs_sum)

    const total = uncompressed_in + compressed_in + uncompressed_out + compressed_out

    const uncompressed_percentage_in = uncompressed_in / total || 0
    const compressed_percentage_in = compressed_in / total || 0
    const compressed_percentage_out = compressed_out / total || 0
    const uncompressed_percentage_out = uncompressed_out / total || 0

    combinedData.push({date, compressed_percentage_in, uncompressed_percentage_in, compressed_percentage_out, uncompressed_percentage_out})
  }

  return combinedData
}

const annotations = [annotationBitcoinQTv0_6, annotationBitcoinQTv0_8]
const startDate = d3.timeParse("%Y-%m-%d")("2011-01-01")
const keys = ["uncompressed_percentage_out", "uncompressed_percentage_in", "compressed_percentage_in", "compressed_percentage_out"]
const colors = {"compressed_percentage_in":  colorYELLOW, "compressed_percentage_out": colorORANGE, "uncompressed_percentage_in": colorBLUE, "uncompressed_percentage_out": colorAQUA}
const labels = {"compressed_percentage_in": "Compressed (in input)", "uncompressed_percentage_in": "Uncompressed (in input)", "compressed_percentage_out": "Compressed (in output)", "uncompressed_percentage_out": "Uncompressed (in output)"}
const dataType = dataTypePercentage
const unit = ""

const chartFunction = stackedAreaChart
