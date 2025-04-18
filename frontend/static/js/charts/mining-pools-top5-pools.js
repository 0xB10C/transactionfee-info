const MOVING_AVERAGE_DAYS = 31
const PRECISION = 2
let START_DATE =  new Date();
START_DATE.setFullYear(new Date().getFullYear() - 5);

const CSVs = [
  fetchCSV("/csv/top5pools.csv"),
]

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
    data.date.push(+(new Date(input[0][i].date)))
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