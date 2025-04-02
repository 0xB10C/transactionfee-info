const chartRollingAverage = 31

const CSVs = [
  d3.csv("/csv/miningpools-antpool-and-friends.csv"),
]

function preprocess(data) {
  combinedData = []

  // We don't know for sure when the smaller pools joined "AntPool & Friends".
  // We assume this started sometime in mid 2022. Ignore all data before that
  // date.
  const ANTPOOL_FRIENDS_START_DATE = new Date(Date.parse("2022-07-01"));

  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)

    if (date < ANTPOOL_FRIENDS_START_DATE) {
      continue
    }

    const total_blocks = parseFloat(data[0][i].total)
    const y = parseFloat(data[0][i]["AntPool & friends"]) / total_blocks
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = []
const chartFunction = lineWithAreaChart
const startDate = d3.timeParse("%Y-%m-%d")("2023-01-01")
const labels = {"y": "share of hashrate"}
const dataType = dataTypePercentage
yAxis.tickFormat(d3.format("~p"));
var yValue = (d => d.y);
var yDomain = (data => [0, 1])
