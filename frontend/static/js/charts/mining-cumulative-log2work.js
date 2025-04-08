const chartRollingAverage = 1

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/log2_work_avg.csv"),
  d3.csv("/csv/block_count_sum.csv"),
]

function preprocess(data) {
  let combinedData = []
  let cumulative_work = 0n
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const log2_work = parseFloat(data[1][i].log2_work_avg)
    const blocks_per_day = parseFloat(data[2][i].block_count_sum)
    cumulative_work += BigInt(Math.round(2 ** log2_work) * blocks_per_day)
    const y = Math.log2(Number(cumulative_work));
    combinedData.push({date, y})
  }

  return combinedData
}

const annotations = [annotationChinaMiningBan]
const labels = {"y": "work"}
const dataType = dataTypeMetric
const unit = ""

var yValue = (d => d.y);
var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])
const chartFunction = lineWithAreaChart
const startDate = d3.timeParse("%Y-%m-%d")("2009-01-03")
