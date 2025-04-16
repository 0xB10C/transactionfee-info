const movingAverageDays = 1
const name = "cumulative work"
const precision = 2
let startDate = new Date("2009-01-01");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/log2_work_avg.csv"),
  fetchCSV("/csv/block_count_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  let cumulative_work = 0n
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const log2_work = parseFloat(input[1][i].log2_work_avg)
    const blocks_per_day = parseFloat(input[2][i].block_count_sum)
    cumulative_work += BigInt(Math.round(2 ** log2_work) * blocks_per_day)
    const y = Number(cumulative_work);
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