// TODO: annotationChinaMiningBan
const movingAverageDays = 7
const name = "hashrate"
const precision = 0
let startDate = new Date("2009-01-01");
const UNIT = "H/s"

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/block_count_sum.csv"),
  fetchCSV("/csv/difficulty_avg.csv"),
]

function preprocess(input) {
  const twoToThe32 = 2 ** 32;
  const minutes_per_day = 24 * 60
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const blocks_per_day = parseFloat(input[1][i].block_count_sum)
    const difficulty = parseFloat(input[2][i].difficulty_avg)
    const block_time_minutes = minutes_per_day / blocks_per_day
    const block_time_seconds = block_time_minutes * 60
    const hashrate = Math.trunc((twoToThe32 * difficulty) / block_time_seconds)
    const y = hashrate
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
    tooltip: { trigger: 'axis', valueFormatter: (v) => formatWithSIPrefix(v, UNIT)},
    xAxis: { type: "time", data: d.date },
    yAxis: { type: 'value', axisLabel: {formatter: (v) => formatWithSIPrefix(v, UNIT) } },
    dataZoom: [ { type: 'inside', startValue: startDate.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: name, smooth: true, type: 'line', areaStyle: {}, data: y, symbol: "none", barCategoryGap: '0%', barGap: '0%', barWidth: '100%',   itemStyle: { borderWidth: 0 } }
    ]
  }
}