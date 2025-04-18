const movingAverageDays = 7
const NAMES = ["vsize", "size"]
const precision = 0
let startDate = new Date();
startDate.setFullYear(new Date().getFullYear() - 5);

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/size_sum.csv"), // block size
  fetchCSV("/csv/vsize_sum.csv"), // block vsize
  fetchCSV("/csv/transactions_sum.csv")
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const tx_per_day = parseFloat(input[3][i].transactions_sum)
    const y1 = parseFloat(input[2][i].vsize_sum) / tx_per_day || 0
    const y2 = parseFloat(input[1][i].size_sum) / tx_per_day || 0
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
      { name: NAMES[0], smooth: false, color: colorBLUE, type: 'line', data: y1, symbol: "none"},
      { name: NAMES[1], smooth: false, color: colorRED, type: 'line', data: y2, symbol: "none"}
    ]
  }
}