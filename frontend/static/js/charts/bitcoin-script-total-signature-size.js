const movingAverageDays = 7
const name = "GB of ECDSA Signatures"
const precision = 2
let startDate = new Date("2009-01-01");


const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_70byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_71byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_72byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_73byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_74byte_sum.csv"),
  fetchCSV("/csv/sigs_ecdsa_length_75byte_or_more_sum.csv"),
]


function preprocess(input) {
  let data = { date: [], y: [] }
  let total = 0;
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const len70 = parseFloat(input[1][i].sigs_ecdsa_length_70byte_sum)
    const len71 = parseFloat(input[2][i].sigs_ecdsa_length_71byte_sum)
    const len72 = parseFloat(input[3][i].sigs_ecdsa_length_72byte_sum)
    const len73 = parseFloat(input[4][i].sigs_ecdsa_length_73byte_sum)
    const len74 = parseFloat(input[5][i].sigs_ecdsa_length_74byte_sum)
    const len75 = parseFloat(input[6][i].sigs_ecdsa_length_75byte_or_more_sum)
    total = total + ((len70*70) + (len71*71) + (len72*72) + (len73*73) + (len74*74) + (len75*75)) / 1000000000.0
    data.y.push(total)
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
      { name: name, smooth: true, type: 'line', areaStyle: {}, data: y, symbol: "none", barCategoryGap: '0%', barGap: '0%', barWidth: '100%',   itemStyle: { borderWidth: 0 } }
    ]
  }
}