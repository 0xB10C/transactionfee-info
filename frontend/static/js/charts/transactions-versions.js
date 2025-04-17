// TODO: const annotations = [{'text': 'BIP-68 Activation', 'date': '2016-07-04'}]
const movingAverageDays = 7
const NAMES = ["v1", "v2", "v3", "unkown version"]
const precision = 1
let startDate = new Date("2016");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/tx_version_1_sum.csv"),
  fetchCSV("/csv/tx_version_2_sum.csv"),
  fetchCSV("/csv/tx_version_3_sum.csv"),
  fetchCSV("/csv/tx_version_unknown_sum.csv"),
  fetchCSV("/csv/transactions_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], v1: [], v2: [], v3: [], version_unknown: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const txs_sum = parseFloat(input[5][i].transactions_sum)
    const v1 = parseFloat(input[1][i].tx_version_1_sum) / txs_sum || 0
    const v2 = parseFloat(input[2][i].tx_version_2_sum) / txs_sum || 0
    const v3 = parseFloat(input[3][i].tx_version_3_sum) / txs_sum || 0
    const version_unknown = parseFloat(input[4][i].tx_version_unknown_sum) / txs_sum || 0
    data.v1.push(v1 * 100)
    data.v2.push(v2 * 100)
    data.v3.push(v3 * 100)
    data.version_unknown.push(version_unknown * 100)
  }
  return data
}

function chartDefinition(d) {
  v1 = zip(d.date, movingAverage(d.v1, movingAverageDays, precision))
  v2 = zip(d.date, movingAverage(d.v2, movingAverageDays, precision))
  v3 = zip(d.date, movingAverage(d.v3, movingAverageDays, precision))
  version_unknown = zip(d.date, movingAverage(d.version_unknown, movingAverageDays, precision))
  return {
    graphic: watermark(watermarkText),
    legend: { },
    toolbox: toolbox(),
    tooltip: { trigger: 'axis', valueFormatter: formatPercentage},
    xAxis: { type: "time", data: d.date },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: formatPercentage } },
    dataZoom: [ { type: 'inside', startValue: startDate.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: NAMES[0], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: v1, symbol: "none"},
      { name: NAMES[1], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: v2, symbol: "none"},
      { name: NAMES[2], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: v3, symbol: "none"},
      { name: NAMES[3], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: version_unknown, symbol: "none"},
    ]
  }
}