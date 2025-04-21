const ANNOTATIONS = [annotationSegWitActivated]
const MOVING_AVERAGE_DAYS = 7
const NAMES = ["Payments", "Block size"]
const PRECISION = 0
let START_DATE =  new Date();
START_DATE.setFullYear(new Date().getFullYear() - 5);
const UNIT_BYTE = "B"

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/payments_sum.csv"),
  fetchCSV("/csv/size_avg.csv"),
];

function preprocess(input) {
  let data = { date: [], y1: [], y2: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const y1 = parseFloat(input[1][i].payments_sum)
    const y2 = parseFloat(input[2][i].size_avg)
    data.y1.push(y1)
    data.y2.push(y2)
  }
  return data
}

function chartDefinition(d) {
  y1 = zip(d.date, movingAverage(d.y1, MOVING_AVERAGE_DAYS, PRECISION))
  y2 = zip(d.date, movingAverage(d.y2, MOVING_AVERAGE_DAYS, PRECISION))
  return {
    ...BASE_CHART_OPTION,
    xAxis: { type: "time", data: d.date },
    yAxis: [
      {
        type: 'value',
        name: 'payments',
        position: 'left',
        axisLabel: {formatter: (v) => formatWithSIPrefix(v)}
      },
      {
        type: 'value',
        name: 'block size',
        position: 'right',
        axisLabel: {formatter: (v) => formatWithSIPrefix(v, UNIT_BYTE)}
      }
    ],
    dataZoom: [ { type: 'inside', startValue: START_DATE.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: NAMES[0], yAxisIndex: 0, smooth: false, areaStyle: {}, type: 'line', data: y1, symbol: "none"},
      { name: NAMES[1], yAxisIndex: 1, smooth: false, areaStyle: {}, type: 'line', data: y2, symbol: "none"}
    ]
  }
}
