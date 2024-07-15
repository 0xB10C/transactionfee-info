const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/Inputs_sum.csv"),
  d3.csv("/csv/Outputs_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y1 = parseFloat(data[1][i].Inputs_sum)
    const y2 = parseFloat(data[2][i].Outputs_sum)
    combinedData.push({date, y1, y2})
  }
  
  return combinedData
}

const annotations = []
const labels = {"y1": "Inputs", "y2": "Outputs"}
const dataType = dataTypeInteger
const unit = ""

const chartFunction = twoLineChart
