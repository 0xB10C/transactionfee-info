const ANNOTATIONS = []
const MOVING_AVERAGE_DAYS = MOVING_AVERAGE_30D
const NAME = "AntPool & friends share"
const PRECISION = 4

// We don't know for sure when the smaller pools joined "AntPool & Friends".
// We assume this started sometime in mid 2022. Ignore all data before that
// date.
const ANTPOOL_FRIENDS_START_DATE = new Date(Date.parse("2022-07-01"));

// set to the first date we have data for
let START_DATE =  ANTPOOL_FRIENDS_START_DATE

const CSVs = [
  // ID from https://github.com/bitcoin-data/mining-pools/blob/generated/pool-list.json
  fetchCSV("/csv/miningpools-antpool-and-friends.csv"),
]

COLORS = ["#D81B60", "#8E24AA", "#5E35B1", "#3949AB", "#1E88E5", "#039BE5"];

let pools = [];

function preprocess(input) {
  let data = { date: [] }
  for (let i = 0; i < input[0].length; i++) {
    const date = new Date(input[0][i].date)
    if (date < ANTPOOL_FRIENDS_START_DATE) {
      continue
    }
    data.date.push(+(date))

    let total = parseInt(input[0][i].total)
    Object.keys(input[0][i]).forEach((k) => {
        if(k != "date" && k != "total" && !pools.includes(k)){
            data[k] = [];
            pools.push(k)
        }
    })
    pools.forEach((p) => {
        data[p].push(
            parseInt(input[0][i][p]) / total
        )
    })
  }
  return data
}

function chartDefinition(d, movingAverage) {
  let other = 100;
  pools.forEach(p => {
    other -= (calcMovingAverage(d[p], movingAverage, PRECISION).slice(-1)[0] * 100)
  })

  color_index = 0
  data = pools.map((p) => {
    let v = (calcMovingAverage(d[p], movingAverage, PRECISION).slice(-1)[0] * 100).toFixed(1)
    let pool = {value: v, name: `${p}\n${v}%`, itemStyle: {color: COLORS[color_index % COLORS.length]}}
    color_index++
    return pool 
  })
  data.sort((a, b) => b.value - a.value)
  data.push({ value: other.toFixed(1), name: `other\n${other.toFixed(1)}%`, itemStyle: {color: "#6b6b6b"}})

  return {
    ...BASE_CHART_OPTION(START_DATE),
    legend: null,
    tooltip: {
      trigger: 'item'
    },
    backgroundColor: '#1d1f31',
    series: [
      {
        name: 'Hashrate share',
        type: 'pie',
        radius: ['15%', '60%'],
        itemStyle: {
          borderColor: '#000',
          borderWidth: 0.5
        },
        data: data,
      }
    ]
  };
}