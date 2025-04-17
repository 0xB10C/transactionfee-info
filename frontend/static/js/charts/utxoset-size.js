const movingAverageDays = 7
const name = "UTXO set size (count)"
const precision = 0
let startDate = new Date("2013");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/inputs_sum.csv"),
  fetchCSV("/csv/outputs_sum.csv"),
  fetchCSV("/csv/outputs_opreturn_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y: [] }
  let utxos = 0;
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    utxos += parseFloat(input[2][i].outputs_sum)
    utxos -= parseFloat(input[3][i].outputs_opreturn_sum)
    utxos -= parseFloat(input[1][i].inputs_sum)
    const y = utxos
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
    tooltip: { trigger: 'axis' },
    xAxis: { type: "time", data: d.date },
    yAxis: { type: 'value' },
    dataZoom: [ { type: 'inside', startValue: startDate.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      // Note that we manually set it to 0 here as we get netgative nubers
      { name: name, smooth: true, min: 0, type: 'line', areaStyle: {}, data: y, symbol: "none", barCategoryGap: '0%', barGap: '0%', barWidth: '100%',   itemStyle: { borderWidth: 0 } }
    ]
  }
}