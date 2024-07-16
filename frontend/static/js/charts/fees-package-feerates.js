const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  // TODO: these are the file names from the Go-version of transactionfee.info
  // and would need to be updated to the Rust version as soon as fee data is
  // available.
  d3.csv("/csv/FeeratePackageMin_avg.csv"),
  d3.csv("/csv/FeeratePackage5thPercentile_avg.csv"),
  d3.csv("/csv/FeeratePackage10thPercentile_avg.csv"),
  d3.csv("/csv/FeeratePackage25thPercentile_avg.csv"),
  d3.csv("/csv/FeeratePackage50thPercentile_avg.csv"),
  d3.csv("/csv/FeeratePackage75thPercentile_avg.csv"),
  d3.csv("/csv/FeeratePackage90thPercentile_avg.csv"),
  d3.csv("/csv/FeeratePackage95thPercentile_avg.csv"),
]

function preprocess(data) {
  combinedData = []

  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const min = parseFloat(data[1][i].FeeratePackageMin_avg)
    const v5thP = parseFloat(data[2][i].FeeratePackage5thPercentile_avg)
    const v10thP = parseFloat(data[3][i].FeeratePackage10thPercentile_avg)
    const v25thP = parseFloat(data[4][i].FeeratePackage25thPercentile_avg)
    const v50thP = parseFloat(data[5][i].FeeratePackage50thPercentile_avg)
    const v75thP = parseFloat(data[6][i].FeeratePackage75thPercentile_avg)
    const v90thP = parseFloat(data[7][i].FeeratePackage90thPercentile_avg)
    const v95thP = parseFloat(data[8][i].FeeratePackage95thPercentile_avg)
    combinedData.push({date, min, v5thP, v10thP, v25thP, v50thP, v75thP, v90thP, v95thP})
  }

  return combinedData
}

const annotations = []
const dataType = dataTypeInteger
const unit = "sat/vbyte"

const chartFunction = percentileChart
