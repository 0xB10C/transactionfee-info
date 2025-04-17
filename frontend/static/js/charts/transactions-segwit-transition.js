// TODO: [annotationSegWitActivated, annotationBitcoinCoreSegWitWalletReleased]
const movingAverageDays = 7
const NAMES = ["legacy only", "mixed", "SegWit only"]
const precision = 1
let startDate = new Date("2017");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/tx_spending_only_legacy_sum.csv"),
  fetchCSV("/csv/tx_spending_only_segwit_sum.csv"),
  fetchCSV("/csv/tx_spending_segwit_and_legacy_sum.csv"),
  fetchCSV("/csv/transactions_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const legacyOnly = parseFloat(input[1][i].tx_spending_only_legacy_sum)
    const segwitOnly = parseFloat(input[2][i].tx_spending_only_segwit_sum)
    const mixed = parseFloat(input[3][i].tx_spending_segwit_and_legacy_sum)
    const total = parseFloat(input[4][i].transactions_sum)
    const y1 = legacyOnly / total || 0
    const y2 = mixed / total || 0
    const y3 = segwitOnly / total || 0
    data.y1.push(y1 * 100)
    data.y2.push(y2 * 100)
    data.y3.push(y3 * 100)
  }
  return data
}

function chartDefinition(d) {
  y1 = zip(d.date, movingAverage(d.y1, movingAverageDays, precision))
  y2 = zip(d.date, movingAverage(d.y2, movingAverageDays, precision))
  y3 = zip(d.date, movingAverage(d.y3, movingAverageDays, precision))
  return {
    graphic: watermark(watermarkText),
    legend: { },
    toolbox: toolbox(),
    tooltip: { trigger: 'axis', valueFormatter: formatPercentage},
    xAxis: { type: "time", data: d.date },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: formatPercentage } },
    dataZoom: [ { type: 'inside', startValue: startDate.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: NAMES[0], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y1, symbol: "none"},
      { name: NAMES[1], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y2, symbol: "none"},
      { name: NAMES[2], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y3, symbol: "none"},
    ]
  }
}