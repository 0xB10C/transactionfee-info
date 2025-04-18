// TODO: annotationBitcoinCore23
const movingAverageDays = 7
const NAMES = ["key-path", "script-path"]
const precision = 1
let startDate = new Date("2021-11");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_p2tr_keypath_sum.csv"),
  fetchCSV("/csv/inputs_p2tr_scriptpath_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const key = parseFloat(input[1][i].inputs_p2tr_keypath_sum)
    const script = parseFloat(input[2][i].inputs_p2tr_scriptpath_sum)
    const sum = key + script

    let key_percentage = key / sum || 0
    let script_percentage = script / sum || 0

    data.y1.push(key_percentage * 100)
    data.y2.push(script_percentage * 100)
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
    tooltip: { trigger: 'axis', valueFormatter: formatPercentage},
    xAxis: { type: "time", data: d.date },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: formatPercentage } },
    dataZoom: [ { type: 'inside', startValue: startDate.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: NAMES[0], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y1, symbol: "none"},
      { name: NAMES[1], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y2, symbol: "none"},
    ]
  }
}