const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = 31
const PRECISION = 2
let START_DATE =  new Date("2014-03");

const CSVs = [
  fetchCSV("/csv/miningpools-centralization-index.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: [], y5: [] }
  for (let i = 0; i < input[0].length; i++) {
    let date = new Date(input[0][i].date)
    data.date.push(+date)
    const total_blocks = parseFloat(input[0][i].total)

    const top1 = parseFloat(input[0][i].top1)
    const top2 = parseFloat(input[0][i].top2)
    const top3 = parseFloat(input[0][i].top3)
    const top4 = parseFloat(input[0][i].top4)
    const top5 = parseFloat(input[0][i].top5)
    const top6 = parseFloat(input[0][i].top6)

    data.y1.push((top1 + top2) / total_blocks * 100)
    data.y2.push((top1 + top2 + top3) / total_blocks * 100)
    data.y3.push((top1 + top2 + top3 + top4) / total_blocks * 100) 
    data.y4.push((top1 + top2 + top3 + top4 + top5) / total_blocks * 100)
    data.y5.push((top1 + top2 + top3 + top4 + top5 + top6) / total_blocks * 100)
  }
  return data
}

function chartDefinition(d) {
  const labels = {
    "y1": "top 2 pools",
    "y2": "top 3 pools",
    "y3": "top 4 pools",
    "y4": "top 5 pools",
    "y5": "top 6 pools",
  }
  
  return {
    ...BASE_CHART_OPTION(START_DATE),
    xAxis: { type: "time" },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: formatPercentage } },
    tooltip: { trigger: 'axis', valueFormatter: formatPercentage},
    series: ["y1", "y2", "y3", "y4", "y5"].map((y) => {
      return {
        name: labels[y],
        type: "line",
        symbol: 'none',
        data: zip(d.date, movingAverage(d[y], MOVING_AVERAGE_DAYS, PRECISION)),
        smooth: true,
      }
    }),
  }
}