const MOVING_AVERAGE_DAYS = 7
const NAME = "Inputs per Outputs"
const PRECISION = 2
let START_DATE =  new Date();
START_DATE.setFullYear(new Date().getFullYear() - 5);

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_sum.csv"),
  fetchCSV("/csv/outputs_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const y = parseFloat(input[1][i].inputs_sum) / parseFloat(input[2][i].outputs_sum)
    data.y.push(y)
  }
  return data
}

function chartDefinition(d) {
  let option = lineChart(d, NAME, MOVING_AVERAGE_DAYS, PRECISION, START_DATE);
  option.series[0]["markLine"] = {
    symbol: "none",
    data: [
      {
        name: '',
        yAxis: 1,
        symbolSize: [0, 0],
        lineStyle: {
          color: "gray",
        },
        aniation: false,
      }
    ]
  }
  return option
}