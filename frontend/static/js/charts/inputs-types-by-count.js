// TODO: const annotations = [{'text': 'P2SH Activation', 'date': '2012-04-01'},{'text': 'SegWit Activation', 'date': '2017-07-24'}]
const movingAverageDays = 31
const NAMES = ["P2PK", "P2PKH", "nested P2WPKH", "P2WPKH", "P2MS", "P2SH", "nested P2WSH", "P2WSH", "P2TR key-path", "P2TR script-path", "Unkown", "Coinbase", "P2A", "other"]
const precision = 1
let startDate = new Date("2015");

const CSVs = [
  fetchCSV("/csv/date.csv"), // 0
  fetchCSV("/csv/inputs_p2pk_sum.csv"),
  fetchCSV("/csv/inputs_p2pkh_sum.csv"),
  fetchCSV("/csv/inputs_nested_p2wpkh_sum.csv"),
  fetchCSV("/csv/inputs_p2wpkh_sum.csv"),
  fetchCSV("/csv/inputs_p2ms_sum.csv"), // 5
  fetchCSV("/csv/inputs_p2sh_sum.csv"),
  fetchCSV("/csv/inputs_nested_p2wsh_sum.csv"),
  fetchCSV("/csv/inputs_p2wsh_sum.csv"),
  fetchCSV("/csv/inputs_p2tr_keypath_sum.csv"),
  fetchCSV("/csv/inputs_p2tr_scriptpath_sum.csv"), // 10
  fetchCSV("/csv/inputs_unknown_sum.csv"),
  fetchCSV("/csv/inputs_coinbase_sum.csv"),
  fetchCSV("/csv/inputs_witness_coinbase_sum.csv"),
  fetchCSV("/csv/inputs_p2a_sum.csv"),
  fetchCSV("/csv/inputs_sum.csv"), // 15
]

function preprocess(input) {
  let data = { date: [], p2pk: [], p2pkh: [], nested_p2wpkh: [], p2wpkh: [], p2ms: [], p2sh: [], nested_p2wsh: [], p2wsh: [], p2tr_keypath: [], p2tr_scriptpath: [], unknown: [], coinbase: [], p2a: [], other: []}
  for (let i = 0; i < input[0].length; i++) {
    data.date.push(+(new Date(input[0][i].date)))
    let counted_total = 0
    const ins_P2PK = parseFloat(input[1][i].inputs_p2pk_sum)
    counted_total += ins_P2PK
    const ins_P2PKH = parseFloat(input[2][i].inputs_p2pkh_sum)
    counted_total += ins_P2PKH
    const ins_Nested_P2WPKH = parseFloat(input[3][i].inputs_nested_p2wpkh_sum)
    counted_total += ins_Nested_P2WPKH
    const ins_P2WPKH = parseFloat(input[4][i].inputs_p2wpkh_sum)
    counted_total += ins_P2WPKH
    const ins_P2MS = parseFloat(input[5][i].inputs_p2ms_sum)
    counted_total += ins_P2MS
    const ins_P2SH = parseFloat(input[6][i].inputs_p2sh_sum)
    counted_total += ins_P2SH
    const ins_Nested_P2WSH = parseFloat(input[7][i].inputs_nested_p2wsh_sum)
    counted_total += ins_Nested_P2WSH
    const ins_P2WSH = parseFloat(input[8][i].inputs_p2wsh_sum)
    counted_total += ins_P2WSH
    const ins_p2trKeypath = parseFloat(input[9][i].inputs_p2tr_keypath_sum)
    counted_total += ins_p2trKeypath
    const ins_p2trScriptpath = parseFloat(input[10][i].inputs_p2tr_scriptpath_sum)
    counted_total += ins_p2trScriptpath
    const ins_unknown = parseFloat(input[11][i].inputs_unknown_sum)
    counted_total += ins_unknown
    const ins_coinbase = parseFloat(input[12][i].inputs_coinbase_sum) + parseFloat(input[13][i].inputs_witness_coinbase_sum)
    counted_total += ins_coinbase
    const ins_p2a = parseFloat(input[14][i].inputs_p2a_sum)
    counted_total += ins_p2a

    const ins_total = parseFloat(input[15][i].inputs_sum)

    const ins_P2PK_percentage = ins_P2PK / ins_total || 0
    const ins_P2PKH_percentage = ins_P2PKH / ins_total || 0
    const ins_Nested_P2WPKH_percentage = ins_Nested_P2WPKH / ins_total || 0
    const ins_P2WPKH_percentage = ins_P2WPKH / ins_total || 0
    const ins_P2MS_percentage = ins_P2MS / ins_total || 0
    const ins_P2SH_percentage = ins_P2SH / ins_total || 0
    const ins_Nested_P2WSH_percentage = ins_Nested_P2WSH / ins_total || 0
    const ins_P2WSH_percentage = ins_P2WSH / ins_total || 0
    const ins_p2trKeypath_percentage = ins_p2trKeypath / ins_total || 0
    const ins_p2trScriptpath_percentage = ins_p2trScriptpath / ins_total || 0
    const ins_unkown_percentage = ins_unknown / ins_total || 0
    const ins_coinbase_percentage = ins_coinbase / ins_total || 0
    const ins_p2a_percentage = ins_p2a / ins_total || 0

    const ins_other = (ins_total - counted_total) / ins_total || 0

    data.p2pk.push(ins_P2PK_percentage * 100)
    data.p2pkh.push(ins_P2PKH_percentage * 100)
    data.nested_p2wpkh.push(ins_Nested_P2WPKH_percentage * 100)
    data.p2wpkh.push(ins_P2WPKH_percentage * 100)
    data.p2ms.push(ins_P2MS_percentage * 100)
    data.p2sh.push(ins_P2SH_percentage * 100)
    data.nested_p2wsh.push(ins_Nested_P2WSH_percentage * 100)
    data.p2wsh.push(ins_P2WSH_percentage * 100)
    data.p2tr_keypath.push(ins_p2trKeypath_percentage * 100)
    data.p2tr_scriptpath.push(ins_p2trScriptpath_percentage * 100)
    data.unknown.push(ins_unkown_percentage * 100)
    data.coinbase.push(ins_coinbase_percentage * 100)
    data.p2a.push(ins_p2a_percentage * 100)
    data.other.push(ins_other * 100)
  }
  return data
}

function chartDefinition(d) {
  return {
    graphic: watermark(watermarkText),
    legend: { },
    toolbox: toolbox(),
    tooltip: { trigger: 'axis', valueFormatter: formatPercentage},
    xAxis: { type: "time", data: d.date },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: formatPercentage } },
    dataZoom: [ { type: 'inside', startValue: startDate.toISOString().slice(0, 10) }, { type: 'slider' }],
    series: [
      { name: NAMES[0], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.p2pk, movingAverageDays, precision))},
      { name: NAMES[1], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.p2pkh, movingAverageDays, precision))},
      { name: NAMES[2], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.nested_p2wpkh, movingAverageDays, precision))},
      { name: NAMES[3], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.p2wpkh, movingAverageDays, precision))},
      { name: NAMES[4], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.p2ms, movingAverageDays, precision))},
      { name: NAMES[5], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.p2sh, movingAverageDays, precision))},
      { name: NAMES[6], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.nested_p2wsh, movingAverageDays, precision))},
      { name: NAMES[7], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.p2wsh, movingAverageDays, precision))},
      { name: NAMES[8], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.p2tr_keypath, movingAverageDays, precision))},
      { name: NAMES[9], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.p2tr_scriptpath, movingAverageDays, precision))},
      { name: NAMES[10], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.unknown, movingAverageDays, precision))},
      { name: NAMES[11], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.coinbase, movingAverageDays, precision))},
      { name: NAMES[12], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.p2a, movingAverageDays, precision))},
      { name: NAMES[13], smooth: true, areaStyle: {}, lineStyle: {width: 0}, stack: "Total", type: 'line', symbol: "none", data: zip(d.date, movingAverage(d.other, movingAverageDays, precision))},
    ]
  }
}