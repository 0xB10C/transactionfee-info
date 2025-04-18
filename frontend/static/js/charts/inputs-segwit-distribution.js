// TODO: annotationSegWitActivated, annotationBitcoinCoreSegWitWalletReleased, annotationBitcoinCore23, annotationTaprootActivated
const movingAverageDays = 7
const NAMES = ["P2WSH", "P2WPKH", "nested P2WSH", "nested P2WPKH", "P2TR key-path", "P2TR script-path"]
const precision = 1
let startDate = new Date("2017-08");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_p2wsh_sum.csv"),
  fetchCSV("/csv/inputs_p2wpkh_sum.csv"),
  fetchCSV("/csv/inputs_nested_p2wpkh_sum.csv"),
  fetchCSV("/csv/inputs_nested_p2wsh_sum.csv"),
  fetchCSV("/csv/inputs_p2tr_keypath_sum.csv"),
  fetchCSV("/csv/inputs_p2tr_scriptpath_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: [], y5: [], y6: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const nativeSH = parseFloat(input[1][i].inputs_p2wsh_sum)
    const nativePKH = parseFloat(input[2][i].inputs_p2wpkh_sum)
    const nestedPKH = parseFloat(input[3][i].inputs_nested_p2wpkh_sum)
    const nestedSH = parseFloat(input[4][i].inputs_nested_p2wsh_sum)
    const p2trKeypath = parseFloat(input[5][i].inputs_p2tr_keypath_sum)
    const p2trScriptpath = parseFloat(input[6][i].inputs_p2tr_scriptpath_sum)

    const total = nativeSH + nativePKH + nestedPKH + nestedSH + p2trKeypath + p2trScriptpath

    const y1 = nativeSH / total || 0
    const y2 = nativePKH / total || 0
    const y3 = nestedPKH / total || 0
    const y4 = nestedSH / total || 0
    const y5 = p2trKeypath / total || 0
    const y6 = p2trScriptpath / total || 0
    
    data.y1.push(y1 * 100)
    data.y2.push(y2 * 100)
    data.y3.push(y3 * 100)
    data.y4.push(y4 * 100)
    data.y5.push(y5 * 100)
    data.y6.push(y6 * 100)
  }
  return data
}

function chartDefinition(d) {
  y1 = zip(d.date, movingAverage(d.y1, movingAverageDays, precision))
  y2 = zip(d.date, movingAverage(d.y2, movingAverageDays, precision))
  y3 = zip(d.date, movingAverage(d.y3, movingAverageDays, precision))
  y4 = zip(d.date, movingAverage(d.y4, movingAverageDays, precision))
  y5 = zip(d.date, movingAverage(d.y5, movingAverageDays, precision))
  y6 = zip(d.date, movingAverage(d.y6, movingAverageDays, precision))
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
      { name: NAMES[3], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y4, symbol: "none"},
      { name: NAMES[4], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y5, symbol: "none"},
      { name: NAMES[5], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y6, symbol: "none"},
    ]
  }
}