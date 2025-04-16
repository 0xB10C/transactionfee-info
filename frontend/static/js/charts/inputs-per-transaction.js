const movingAverageDays = 7
const name = "inputs per transaction"
const precision = 2
let startDate = new Date();
startDate.setFullYear(new Date().getFullYear() - 3);

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_sum.csv"),
  fetchCSV("/csv/transactions_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const y = parseFloat(input[2][i].transactions_sum) / parseFloat(input[1][i].inputs_sum) || 0
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