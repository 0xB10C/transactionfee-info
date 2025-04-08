const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/block_count_sum.csv"),
  d3.csv("/csv/difficulty_avg.csv"),
]

function preprocess(data) {
  let combinedData = []
  const twoToThe32 = 2 ** 32;
  const minutes_per_day = 24 * 60
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const blocks_per_day = parseFloat(data[1][i].block_count_sum)
    const difficulty = parseFloat(data[2][i].difficulty_avg)
    const block_time_minutes = minutes_per_day / blocks_per_day
    const block_time_seconds = block_time_minutes * 60
    const hashrate = Math.trunc((twoToThe32 * difficulty) / block_time_seconds)
    const y = hashrate
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = [annotationChinaMiningBan]
const labels = {"y": "Hashrate"}
const dataType = dataTypeMetric
const unit = "H/s"

var yValue = (d => d.y);
var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])
const startDate = d3.timeParse("%Y-%m-%d")("2017-07-01")
const chartFunction = lineWithAreaChart
