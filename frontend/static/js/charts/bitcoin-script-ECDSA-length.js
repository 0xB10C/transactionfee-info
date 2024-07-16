const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/sigs_ecdsa_length_less_70byte_sum.csv"),
  d3.csv("/csv/sigs_ecdsa_length_70byte_sum.csv"),
  d3.csv("/csv/sigs_ecdsa_length_71byte_sum.csv"),
  d3.csv("/csv/sigs_ecdsa_length_72byte_sum.csv"),
  d3.csv("/csv/sigs_ecdsa_length_73byte_sum.csv"),
  d3.csv("/csv/sigs_ecdsa_length_74byte_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const lenLess70= parseFloat(data[1][i].sigs_ecdsa_length_less_70byte_sum)
    const len70 = parseFloat(data[2][i].sigs_ecdsa_length_70byte_sum)
    const len71 = parseFloat(data[3][i].sigs_ecdsa_length_71byte_sum)
    const len72 = parseFloat(data[4][i].sigs_ecdsa_length_72byte_sum)
    const len73 = parseFloat(data[5][i].sigs_ecdsa_length_73byte_sum)
    const len74 = parseFloat(data[6][i].sigs_ecdsa_length_74byte_sum)

    const total = lenLess70 + len70 + len71 + len72 + len73 + len74

    const lenLess70_percentage = lenLess70 / total || 0
    const len70_percentage = len70 / total || 0
    const len71_percentage = len71 / total || 0
    const len72_percentage = len72 / total || 0
    const len73_percentage = len73 / total || 0
    const len74_percentage = len74 / total || 0

    const filler = total == 0 ? 1 : 0

    combinedData.push({date, lenLess70_percentage, len70_percentage, len71_percentage, len72_percentage, len73_percentage, len74_percentage, filler})
  }

  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2011-01-01")
const annotations = [annotationBitcoinCorev0_9, annotationBitcoinCorev0_11_1, annotationBitcoinCorev0_17]
const labels = {"lenLess70_percentage": "<70 byte", "len70_percentage": "70 byte", "len71_percentage": "71 byte", "len72_percentage": "72 byte", "len73_percentage": "73 byte", "len74_percentage": "74 byte"}
const dataType = dataTypePercentage
const unit = ""

var keys = ["lenLess70_percentage", "len70_percentage", "len71_percentage", "len72_percentage", "len73_percentage", "len74_percentage"] 
var colors = {"lenLess70_percentage": colorGRAY, "len70_percentage": colorORANGE, "len71_percentage": colorBLUE, "len72_percentage": colorYELLOW, "len73_percentage": colorRED, "len74_percentage": colorGREEN}

const chartFunction = stackedAreaChart
