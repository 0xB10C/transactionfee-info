// TODO: annotationSegWitActivated
const movingAverageDays = 7
const NAMES = ["P2MS", "P2SH", "nested P2WSH", "P2WSH"]
const precision = 1
let startDate = new Date("2017-08");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_spending_p2ms_multisig_sum.csv"),
  fetchCSV("/csv/inputs_spending_p2sh_multisig_sum.csv"),
  fetchCSV("/csv/inputs_spending_nested_p2wsh_multisig_sum.csv"),
  fetchCSV("/csv/inputs_spending_p2wsh_multisig_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))

    const ms_P2MS = parseFloat(input[1][i].inputs_spending_p2ms_multisig_sum)
    const ms_P2SH = parseFloat(input[2][i].inputs_spending_p2sh_multisig_sum)
    const ms_Nested_P2WSH = parseFloat(input[3][i].inputs_spending_nested_p2wsh_multisig_sum)
    const ms_P2WSH = parseFloat(input[4][i].inputs_spending_p2wsh_multisig_sum)

    const total = ms_P2MS + ms_P2SH + ms_Nested_P2WSH + ms_P2WSH

    const ms_P2MS_percentage = ms_P2MS / total || 0
    const ms_P2SH_percentage = ms_P2SH / total || 0
    const ms_Nested_P2WSH_percentage = ms_Nested_P2WSH / total || 0
    const ms_P2WSH_percentage = ms_P2WSH / total || 0
    
    data.y1.push(ms_P2MS_percentage * 100)
    data.y2.push(ms_P2SH_percentage * 100)
    data.y3.push(ms_Nested_P2WSH_percentage * 100)
    data.y4.push(ms_P2WSH_percentage * 100)
  }
  return data
}

function chartDefinition(d) {
  y1 = zip(d.date, movingAverage(d.y1, movingAverageDays, precision))
  y2 = zip(d.date, movingAverage(d.y2, movingAverageDays, precision))
  y3 = zip(d.date, movingAverage(d.y3, movingAverageDays, precision))
  y4 = zip(d.date, movingAverage(d.y4, movingAverageDays, precision))

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
    ]
  }
}