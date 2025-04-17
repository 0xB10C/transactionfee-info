const movingAverageDays = 7
const NAMES = ["inputs", "outputs"]
const precision = 0
let startDate = new Date();
startDate.setFullYear(new Date().getFullYear() - 3);

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_sum.csv"),
  fetchCSV("/csv/outputs_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const y1 = parseFloat(input[1][i].inputs_sum)
    const y2 = parseFloat(input[2][i].outputs_sum)
    data.y1.push(y1)
    data.y2.push(y2)
  }
  return data
}

function chartDefinition(d) {
  y1 = zip(d.date, movingAverage(d.y1, movingAverageDays, precision))
  y2 = zip(d.date, movingAverage(d.y2, movingAverageDays, precision))
  return {
    graphic: watermark(watermarkText),
    legend: { },
    toolbox: toolbox(),
    tooltip: { trigger: 'axis'},
    xAxis: { type: "time", data: d.date },
    yAxis: { type: 'value' },
    dataZoom: [ { type: 'inside', startValue: startDate.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: NAMES[0], smooth: true, color: colorBLUE, type: 'line', data: y1, symbol: "none"},
      { name: NAMES[1], smooth: true, color: colorRED, type: 'line', data: y2, symbol: "none"}
    ]
  }
}