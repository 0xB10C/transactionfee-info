const chartRollingAverage = 31

const CSVs = [
  d3.csv("/csv/miningpools-centralization-index.csv"),
]

const labels = {
  "y1": "top 2 pools",
  "y2": "top 3 pools",
  "y3": "top 4 pools",
  "y4": "top 5 pools",
  "y5": "top 6 pools",
}

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const total_blocks = parseFloat(data[0][i].total)
    const top1 = parseFloat(data[0][i].top1)
    const top2 = parseFloat(data[0][i].top2)
    const top3 = parseFloat(data[0][i].top3)
    const top4 = parseFloat(data[0][i].top4)
    const top5 = parseFloat(data[0][i].top5)
    const top6 = parseFloat(data[0][i].top6)

    const y1 = (top1 + top2) / total_blocks
    const y2 = (top1 + top2 + top3) / total_blocks
    const y3 = (top1 + top2 + top3 + top4) / total_blocks
    const y4 = (top1 + top2 + top3 + top4 + top5) / total_blocks
    const y5 = (top1 + top2 + top3 + top4 + top5 + top6) / total_blocks

    combinedData.push({date, y1, y2, y3, y4, y5})
  }

  return combinedData
}

const annotations = []
const dataType = dataTypePercentage
yAxis.tickFormat(d3.format("~p"));
const chartFunction = fiveLineChart
const startDate = new Date(Date.parse("2014-02-12"))
