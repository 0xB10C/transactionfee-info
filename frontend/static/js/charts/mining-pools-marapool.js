const movingAverageDays = 7
const name = "MARAPool share"
const precision = 2
// set to the first date we have data for
let startDate = undefined

const CSVs = [
  // ID from https://github.com/bitcoin-data/mining-pools/blob/generated/pool-list.json
  fetchCSV("/csv/miningpools-poolid-140.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    const date = new Date(input[0][i].date)
    if (startDate === undefined) {
      startDate = date
    }
    const y = parseFloat(input[0][i].count / input[0][i].total)
    data.date.push(+(date))
    data.y.push(y*100)
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
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: function (value) { return value + '%'; } } },
    dataZoom: [ { type: 'inside', startValue: startDate.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: name, smooth: true, type: 'line', areaStyle: {}, data: y, symbol: "none", barCategoryGap: '0%', barGap: '0%', barWidth: '100%',   itemStyle: { borderWidth: 0 } }
    ]
  }
}