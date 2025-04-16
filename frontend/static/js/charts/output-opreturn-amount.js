const movingAverageDays = 7
const name = "BTC in OP_RETURN"
const precision = 8
let startDate = new Date("2013-01-01");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/outputs_opreturn_amount_sum.csv"),
]

function preprocess(input) {
  cumulativeValue = 0
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    cumulativeValue += parseFloat(input[1][i].outputs_opreturn_amount_sum)
    data.y.push(cumulativeValue/ 100_000_000)
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
