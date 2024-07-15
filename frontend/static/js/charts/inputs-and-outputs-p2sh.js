const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/InputsP2SH_sum.csv"),
  d3.csv("/csv/OutputsP2SH_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y1 = parseFloat(data[1][i].InputsP2SH_sum)
    const y2 = parseFloat(data[2][i].OutputsP2SH_sum)
    combinedData.push({date, y1, y2})
  }
  
  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")("2012-01-01")
const annotations = [{'text': 'P2SH Activation', 'date': '2012-04-01'},{'text': 'SegWit Activation', 'date': '2017-07-24'}]
const labels = {"y1": "Inputs", "y2": "Outputs"}
const dataType = dataTypeInteger
const unit = ""

const chartFunction = twoLineChart
