const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = 31
const PRECISION = 2
let START_DATE =  new Date("2023");

const CSVs = [
  fetchCSV("/csv/miningpools-antpool-and-friends.csv"),
]

// We don't know for sure when the smaller pools joined "AntPool & Friends".
// We assume this started sometime in mid 2022. Ignore all data before that
// date.
const ANTPOOL_FRIENDS_START_DATE = new Date(Date.parse("2022-09-01"));

function preprocess(input) {
  let data = { date: [], names: [], pools: { } }
  let _keys = Object.keys(input[0][0]);
  for(k of _keys) {
    // skip "date" and "total", these are not pool names
    if (k == "date" || k == "total") {
      continue
    }
    data.names.push(k)
  }
  
  for (let i = 0; i < input[0].length; i++) {
    let date = new Date(input[0][i].date)
    if (date < ANTPOOL_FRIENDS_START_DATE) {
      continue
    }
    data.date.push(+date)
    const total_blocks = parseFloat(input[0][i].total)
    for(pool of data.names) {
      if(data.pools[pool] === undefined) {
        data.pools[pool] = []
      }
      data.pools[pool].push(parseFloat(input[0][i][pool]) / total_blocks * 100)
    }
  }
  return data
}

function chartDefinition(d) {
  return {
    ...BASE_CHART_OPTION,
    xAxis: { type: "time" },
    yAxis: { type: 'value' },
    dataZoom: [ { type: 'inside', startValue: START_DATE.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: d.names.map((n) => {
      return {
        name: n,
        type: "line",
        symbol: 'none',
        data: zip(d.date, movingAverage(d.pools[n], MOVING_AVERAGE_DAYS, PRECISION)),
        smooth: true,
      }
    }),
  }
}