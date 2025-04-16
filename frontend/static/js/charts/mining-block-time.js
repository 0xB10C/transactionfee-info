// TODO: annoation annotationChinaMiningBan
// TODO: average line
// TODO: expected line
const movingAverageDays = 7
const name = "block time"
const precision = 2
let startDate = new Date("2017");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/block_count_sum.csv"),
]

function preprocess(input) {
  const minutes_per_day = 24 * 60
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const blocks_per_day = parseFloat(input[1][i].block_count_sum)
    const y = minutes_per_day / blocks_per_day
    data.y.push(y)
  }
  return data
}

function chartDefinition(d) {
  y = zip(d.date, movingAverage(d.y, movingAverageDays, precision))
  return {
    graphic: watermark(watermarkText),
    legend: { },
    toolbox: toolbox(),
    tooltip: { trigger: 'axis' },
    xAxis: { type: "time", data: d.date },
    yAxis: { type: 'value' },
    dataZoom: [ { type: 'inside', startValue: startDate.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: name, smooth: true, type: 'line', areaStyle: {}, data: y, symbol: "none", barCategoryGap: '0%', barGap: '0%', barWidth: '100%',   itemStyle: { borderWidth: 0 } }
    ]
  }
}