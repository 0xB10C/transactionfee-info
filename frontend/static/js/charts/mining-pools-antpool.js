const chartRollingAverage = 7

const CSVs = [
  // ID from https://github.com/bitcoin-data/mining-pools/blob/generated/pool-list.json
  d3.csv("/csv/miningpools-poolid-61.csv"),
]

// set to the first date we have data for
let startDate = undefined

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    if (startDate === undefined) {
      startDate = date
    }
    const y = parseFloat(data[0][i].count / data[0][i].total)
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = []
const labels = {"y": "share of hashrate"}
const dataType = dataTypePercentage
yAxis.tickFormat(d3.format("~p"));
var yValue = (d => d.y);
var yDomain = (data => [0, 1])

const chartFunction = lineWithAreaChart
