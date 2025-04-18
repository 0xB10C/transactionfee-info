// TODO: annotationBIP66Activated
const movingAverageDays = 31
const NAMES = ["DER encoded", "not DER encoded"]
const precision = 1
let startDate = new Date("2011");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/sigs_ecdsa_strict_der_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_not_strict_der_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: [], y5: [], y6: [], y7: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))

    const strict = parseFloat(input[1][i].sigs_ecdsa_strict_der_sum)
    const notStrict = parseFloat(input[2][i].sigs_ecdsa_not_strict_der_sum)

    const total = strict + notStrict

    const strict_percentage = strict / total || 0
    const notStrict_percentage = notStrict / total || 0

    data.y1.push(strict_percentage * 100)
    data.y2.push(notStrict_percentage * 100)
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