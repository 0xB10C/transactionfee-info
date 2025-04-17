const movingAverageDays = 7
const name = "lock-by-block-height"
const precision = 2
let startDate = new Date("2015");


const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/tx_timelock_not_enforced_sum.csv"),
  fetchCSV("/csv/transactions_sum.csv"),
  fetchCSV("/csv/tx_timelock_height_sum.csv"),
  fetchCSV("/csv/tx_timelock_timestamp_sum.csv"),
]

// TODO: this calculation is incorrect:
// https://github.com/0xB10C/transactionfee-info/issues/54
function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const not_enforced = parseFloat(input[1][i].tx_timelock_not_enforced_sum)
    const all_tx = parseFloat(input[2][i].transactions_sum)
    const timelocked = parseFloat(input[3][i].tx_timelock_height_sum) + parseFloat(input[4][i].tx_timelock_timestamp_sum)
    const y = (not_enforced/all_tx)
    data.y.push(y * 100)
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
