const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/sigs_ecdsa_low_rs_sum.csv"),
  d3.csv("/csv/sigs_ecdsa_high_rs_sum.csv"),
  d3.csv("/csv/sigs_ecdsa_low_r_high_s_sum.csv"),
  d3.csv("/csv/sigs_ecdsa_high_r_low_s_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const LowRS = parseFloat(data[1][i].sigs_ecdsa_low_rs_sum)
    const HighRS = parseFloat(data[2][i].sigs_ecdsa_high_rs_sum)
    const LowRHighS = parseFloat(data[3][i].sigs_ecdsa_low_r_high_s_sum)
    const HighRLowS = parseFloat(data[4][i].sigs_ecdsa_high_r_low_s_sum)

    const total = LowRS + HighRS + LowRHighS + HighRLowS

    const LowRS_percentage = LowRS / total || 0
    const HighRS_percentage = HighRS / total || 0
    const LowRHighS_percentage = LowRHighS / total || 0
    const HighRLowS_percentage = HighRLowS / total || 0

    const filler = total == 0 ? 1 : 0

    combinedData.push({date, LowRS_percentage, HighRS_percentage, LowRHighS_percentage, HighRLowS_percentage, filler})
  }

  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2011-05-01")
const annotations = [annotationBitcoinCorev0_17, annotationBitcoinCorev0_9, annotationBitcoinCorev0_11_1]
const labels = {"LowRS_percentage": "low r & low S", "HighRS_percentage": "high r & high S", "LowRHighS_percentage": "low r & high S", "HighRLowS_percentage": "high r & low S"}
const dataType = dataTypePercentage
const unit = ""

var keys = ["LowRS_percentage", "HighRS_percentage", "LowRHighS_percentage", "HighRLowS_percentage"] 
var colors = {"LowRS_percentage": colorP2MS, "HighRS_percentage": colorNestedP2WSH, "LowRHighS_percentage": colorP2SH, "HighRLowS_percentage": colorP2WSH}

const chartFunction = stackedAreaChart
