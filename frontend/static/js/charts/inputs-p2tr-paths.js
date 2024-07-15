const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/InputsP2TRKeyPath_sum.csv"),
  d3.csv("/csv/InputsP2TRScriptPath_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const key = parseFloat(data[1][i].InputsP2TRKeyPath_sum)
    const script = parseFloat(data[2][i].InputsP2TRScriptPath_sum)
    const sum = key + script

    let key_percentage = 0
    if (!isNaN(key / sum)) {
        key_percentage = key / sum
    }

    let script_percentage = 0
    if (!isNaN(script / sum)) {
        script_percentage = script / sum
    }

    combinedData.push({date, key_percentage, script_percentage})
  }

  return combinedData
}

const annotations = [annotationBitcoinCore23]

const keys = ["key_percentage", "script_percentage"]
const colors = {"key_percentage": colorBLUE,  "script_percentage": colorYELLOW}
const labels = {"key_percentage": "key-path spends",  "script_percentage": "script-path spend"}
const dataType = dataTypePercentage
const unit = ""
const startDate = d3.timeParse("%Y-%m-%d")("2021-11-01")

const chartFunction = stackedAreaChart