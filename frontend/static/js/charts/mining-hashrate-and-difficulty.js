// TODO: annotationChinaMiningBan
const MOVING_AVERAGE_DAYS = 7
const NAMES = ["Hashrate", "Difficulty"]
const PRECISION = 0
let START_DATE =  new Date();
START_DATE.setFullYear(new Date().getFullYear() - 5);
const UNIT_HASHRATE = "H/s"

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/difficulty_avg.csv"),
  fetchCSV("/csv/block_count_sum.csv"),
];

function preprocess(input) {
  const minutes_per_day = 24 * 60
  const twoToThe32 = 2 ** 32;
  let data = { date: [], y1: [], y2: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const difficulty = parseFloat(input[1][i].difficulty_avg)
    const blocks_per_day = parseFloat(input[2][i].block_count_sum)
    const block_time_minutes = minutes_per_day / blocks_per_day
    const block_time_seconds = block_time_minutes * 60
    const hashrate = Math.trunc((twoToThe32 * difficulty) / block_time_seconds)
    data.y1.push(hashrate)
    data.y2.push(difficulty)
  }
  return data
}

function chartDefinition(d) {
  y1 = zip(d.date, movingAverage(d.y1, MOVING_AVERAGE_DAYS, PRECISION))
  y2 = zip(d.date, movingAverage(d.y2, MOVING_AVERAGE_DAYS, PRECISION))
  return {
    ...BASE_CHART_OPTION,
    tooltip: { trigger: 'axis', valueFormatter: (v) => formatWithSIPrefix(v) },
    xAxis: { type: "time", data: d.date },
    yAxis: [
      {
        type: 'value',
        name: 'hashrate',
        position: 'left',
        axisLabel: {formatter: (v) => formatWithSIPrefix(v, UNIT_HASHRATE)}
      },
      {
        type: 'value',
        name: 'difficulty',
        position: 'right',
        axisLabel: {formatter: (v) => formatWithSIPrefix(v)}
      }
    ],
    dataZoom: [ { type: 'inside', startValue: START_DATE.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: NAMES[0], yAxisIndex: 0, smooth: false, type: 'line', data: y1, symbol: "none"},
      { name: NAMES[1], yAxisIndex: 1, smooth: false, type: 'line', data: y2, symbol: "none"}
    ]
  }
}