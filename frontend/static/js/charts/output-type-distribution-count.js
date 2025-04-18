// TODO: const annotations = [{'text': 'P2SH Activation', 'date': '2012-04-01'},{'text': 'SegWit Activation', 'date': '2017-07-24'}]
const movingAverageDays = 7
const NAMES = ["P2PK", "P2PKH", "P2WPKH", "P2MS", "P2SH", "P2WSH", "P2TR", "OPRETURN", "P2A", "other"]
const precision = 1
let startDate = new Date("2016");

const CSVs = [
  fetchCSV("/csv/date.csv"),
  fetchCSV("/csv/outputs_p2pk_sum.csv"),
  fetchCSV("/csv/outputs_p2pkh_sum.csv"),
  fetchCSV("/csv/outputs_p2wpkh_sum.csv"),
  fetchCSV("/csv/outputs_p2ms_sum.csv"),
  fetchCSV("/csv/outputs_p2sh_sum.csv"),
  fetchCSV("/csv/outputs_p2wsh_sum.csv"),
  fetchCSV("/csv/outputs_p2tr_sum.csv"),
  fetchCSV("/csv/outputs_opreturn_sum.csv"),
  fetchCSV("/csv/outputs_p2a_sum.csv"),
  fetchCSV("/csv/outputs_sum.csv"),
]

function preprocess(input) {
  let data = { date: [], y1: [], y2: [], y3: [], y4: [], y5: [], y6: [], y7: [], y8: [], y9: [], y10: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    const outs_P2PK = parseFloat(input[1][i].outputs_p2pk_sum)
    const outs_P2PKH = parseFloat(input[2][i].outputs_p2pkh_sum)
    const outs_P2WPKH = parseFloat(input[3][i].outputs_p2wpkh_sum)
    const outs_P2MS = parseFloat(input[4][i].outputs_p2ms_sum)
    const outs_P2SH = parseFloat(input[5][i].outputs_p2sh_sum)
    const outs_P2WSH = parseFloat(input[6][i].outputs_p2wsh_sum)
    const outs_P2TR = parseFloat(input[7][i].outputs_p2tr_sum)
    const outs_OPRETURN = parseFloat(input[8][i].outputs_opreturn_sum)
    const outs_P2A = parseFloat(input[9][i].outputs_p2a_sum)
    
    const total = parseFloat(input[10][i].outputs_sum)

    const counted_total = outs_P2PK + outs_P2PKH + outs_P2WPKH + outs_P2MS + outs_P2SH + outs_OPRETURN + outs_P2WSH + outs_P2TR + outs_P2A
    const outs_other = total - counted_total

    const outs_P2PK_percentage = outs_P2PK / total || 0
    const outs_P2PKH_percentage = outs_P2PKH / total || 0
    const outs_P2WPKH_percentage = outs_P2WPKH / total || 0
    const outs_P2MS_percentage = outs_P2MS / total || 0
    const outs_P2SH_percentage = outs_P2SH / total || 0
    const outs_P2WSH_percentage = outs_P2WSH / total || 0
    const outs_P2TR_percentage = outs_P2TR / total || 0
    const outs_OPRETURN_percentage = outs_OPRETURN / total || 0
    const outs_P2A_percentage = outs_P2A / total || 0
    const outs_other_percentage = outs_other / total || 0
    
    data.y1.push(outs_P2PK_percentage * 100)
    data.y2.push(outs_P2PKH_percentage * 100)
    data.y3.push(outs_P2WPKH_percentage * 100)
    data.y4.push(outs_P2MS_percentage * 100)
    data.y5.push(outs_P2SH_percentage * 100)
    data.y6.push(outs_P2WSH_percentage * 100)
    data.y7.push(outs_P2TR_percentage * 100)
    data.y8.push(outs_OPRETURN_percentage * 100)
    data.y9.push(outs_P2A_percentage * 100)
    data.y10.push(outs_other_percentage * 100)
  }
  return data
}

function chartDefinition(d) {
  y1 = zip(d.date, movingAverage(d.y1, movingAverageDays, precision))
  y2 = zip(d.date, movingAverage(d.y2, movingAverageDays, precision))
  y3 = zip(d.date, movingAverage(d.y3, movingAverageDays, precision))
  y4 = zip(d.date, movingAverage(d.y4, movingAverageDays, precision))
  y5 = zip(d.date, movingAverage(d.y5, movingAverageDays, precision))
  y6 = zip(d.date, movingAverage(d.y6, movingAverageDays, precision))
  y7 = zip(d.date, movingAverage(d.y7, movingAverageDays, precision))
  y8 = zip(d.date, movingAverage(d.y8, movingAverageDays, precision))
  y9 = zip(d.date, movingAverage(d.y9, movingAverageDays, precision))
  y10 = zip(d.date, movingAverage(d.y10, movingAverageDays, precision))
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
      { name: NAMES[2], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y3, symbol: "none"},
      { name: NAMES[3], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y4, symbol: "none"},
      { name: NAMES[4], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y5, symbol: "none"},
      { name: NAMES[5], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y6, symbol: "none"},
      { name: NAMES[6], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y7, symbol: "none"},
      { name: NAMES[7], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y8, symbol: "none"},
      { name: NAMES[8], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y9, symbol: "none"},
      { name: NAMES[9], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', data: y10, symbol: "none"},
    ]
  }
}