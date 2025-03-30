const chartRollingAverage = 31

const CSVs = [
  d3.csv("/csv/top5pools.csv"),
]

let labels = {}

let dynamicKeys = []

function preprocess(data) {
  combinedData = []
  let _keys = Object.keys(data[0][0]);
  for(i in _keys) {
    // skip "date" and "total"
    if (i == 0 || i == 6) {
      continue
    }
    dynamicKeys.push(_keys[i])
  }

  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const total_blocks = parseFloat(data[0][i].total)
    const y1 = parseFloat(data[0][i][dynamicKeys[0]]) / total_blocks
    const y2 = parseFloat(data[0][i][dynamicKeys[1]]) / total_blocks
    const y3 = parseFloat(data[0][i][dynamicKeys[2]]) / total_blocks
    const y4 = parseFloat(data[0][i][dynamicKeys[3]]) / total_blocks
    const y5 = parseFloat(data[0][i][dynamicKeys[4]]) / total_blocks
    combinedData.push({date, y5, y2, y3, y4, y1})
  }

  labels["y5"] = dynamicKeys[4]
  labels["y4"] = dynamicKeys[3]
  labels["y3"] = dynamicKeys[2]
  labels["y2"] = dynamicKeys[1]
  labels["y1"] = dynamicKeys[0]

  return combinedData
}

const annotations = []
const dataType = dataTypePercentage
yAxis.tickFormat(d3.format("~p"));
const chartFunction = fiveLineChart
const startDate = new Date() - (DAYS31*12*4)
