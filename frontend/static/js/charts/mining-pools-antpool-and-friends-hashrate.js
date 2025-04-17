const movingAverageDays = 7
const name = "AntPool & friends share"
const precision = 2

// We don't know for sure when the smaller pools joined "AntPool & Friends".
// We assume this started sometime in mid 2022. Ignore all data before that
// date.
const ANTPOOL_FRIENDS_START_DATE = new Date(Date.parse("2022-07-01"));

// set to the first date we have data for
let startDate = ANTPOOL_FRIENDS_START_DATE


const CSVs = [
  // ID from https://github.com/bitcoin-data/mining-pools/blob/generated/pool-list.json
  fetchCSV("/csv/miningpools-antpool-and-friends.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    const date = new Date(input[0][i].date)
    if (date < ANTPOOL_FRIENDS_START_DATE) {
      continue
    }
    const y = parseFloat(input[0][i]["AntPool & friends"] / input[0][i].total)
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