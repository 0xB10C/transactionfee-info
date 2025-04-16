const movingAverageDays = 7
const name = "RBF signaling"
const precision = 2
let startDate = new Date("2016");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/payments_sum.csv"),
  fetchCSV("/csv/payments_signaling_explicit_rbf_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    const date = new Date(input[0][i].date)
    const y =  parseFloat(input[2][i].payments_signaling_explicit_rbf_sum) / parseFloat(input[1][i].payments_sum) || 0
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