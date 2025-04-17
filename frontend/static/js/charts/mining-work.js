// TODO: annotationChinaMiningBan
const movingAverageDays = 1
const name = "work"
const precision = 0
let startDate = new Date("2009-01-01");
const UNIT = "H"

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/log2_work_avg.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const log2_work = parseFloat(input[1][i].log2_work_avg)
    const y = 2 ** log2_work;
    data.y.push(y)
  }
  return data
}

function chartDefinition(d) {
  y = zip(d.date, movingAverage(d.y, movingAverageDays, precision))
  return {
    graphic: watermark(watermarkText),
    legend: { },
    toolbox: toolbox(),
    tooltip: { trigger: 'axis', valueFormatter: (v) => formatWithSIPrefix(v, UNIT)},
    xAxis: { type: "time", data: d.date },
    yAxis: { type: 'value', axisLabel: {formatter: (v) => formatWithSIPrefix(v, UNIT) } },
    dataZoom: [ { type: 'inside', startValue: startDate.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: name, smooth: true, type: 'line', areaStyle: {}, data: y, symbol: "none", barCategoryGap: '0%', barGap: '0%', barWidth: '100%',   itemStyle: { borderWidth: 0 } }
    ]
  }
}


