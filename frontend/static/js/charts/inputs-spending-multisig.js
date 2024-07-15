const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/Inputs_sum.csv"),
  d3.csv("/csv/InputsSpendingMultiSig_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y =  parseFloat(data[2][i].InputsSpendingMultiSig_sum) / parseFloat(data[1][i].Inputs_sum)
    combinedData.push({date, y})
  }
  
  return combinedData
}

const annotations = []
const labels = {"y": "Multisig spending"}
const dataType = dataTypePercentage
const unit = ""

var yDomain = (_ => [0, 1])
yAxis.tickFormat(d3.format("~p"));

const chartFunction = lineWithAreaChart
