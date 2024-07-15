const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/InputsP2WSHV0_sum.csv"),
  d3.csv("/csv/InputsP2WPKHV0_sum.csv"),
  d3.csv("/csv/InputsNestedP2WPKH_sum.csv"),
  d3.csv("/csv/InputsNestedP2WSH_sum.csv"),
  d3.csv("/csv/InputsP2TRKeyPath_sum.csv"),
  d3.csv("/csv/InputsP2TRScriptPath_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const nativeSH = parseFloat(data[1][i].InputsP2WSHV0_sum)
    const nativePKH = parseFloat(data[2][i].InputsP2WPKHV0_sum)
    const nestedPKH = parseFloat(data[3][i].InputsNestedP2WPKH_sum)
    const nestedSH = parseFloat(data[4][i].InputsNestedP2WSH_sum)
    const p2trKeypath = parseFloat(data[5][i].InputsP2TRKeyPath_sum)
    const p2trScriptpath = parseFloat(data[6][i].InputsP2TRScriptPath_sum)

    const total = nativeSH + nativePKH + nestedPKH + nestedSH + p2trKeypath + p2trScriptpath

    const P2WSHv0_percentage = nativeSH / total || 0
    const P2WPKHv0_percentage = nativePKH / total || 0
    const NestedP2WPKH_percentage = nestedPKH / total || 0
    const NestedP2WSH_percentage = nestedSH / total || 0
    const p2trKeypath_percentage = p2trKeypath / total || 0
    const p2trScriptpath_percentage = p2trScriptpath / total || 0

    combinedData.push({date, NestedP2WPKH_percentage, NestedP2WSH_percentage, P2WPKHv0_percentage, P2WSHv0_percentage, p2trKeypath_percentage, p2trScriptpath_percentage})
  }
  
  return combinedData
}

const startDate = d3.timeParse("%Y-%m-%d")(annotationSegWitActivated.date) - DAYS31
const annotations = [annotationSegWitActivated, annotationBitcoinCoreSegWitWalletReleased, annotationBitcoinCore23, annotationTaprootActivated]
const keys = ["P2WSHv0_percentage", "P2WPKHv0_percentage", "NestedP2WSH_percentage", "NestedP2WPKH_percentage", "p2trKeypath_percentage", "p2trScriptpath_percentage"]
const colors = {"P2WSHv0_percentage": colorP2WSH, "P2WPKHv0_percentage": colorP2WPKH, "NestedP2WSH_percentage": colorNestedP2WSH, "NestedP2WPKH_percentage": colorNestedP2WPKH, "p2trKeypath_percentage": colorP2TR, "p2trScriptpath_percentage": colorTEAL}
const labels = {"P2WSHv0_percentage": "P2WSHv0", "P2WPKHv0_percentage": "P2WPKHv0", "NestedP2WSH_percentage": "Nested P2WSH", "NestedP2WPKH_percentage": "Nested P2WPKH", "p2trKeypath_percentage": "P2TR key-path", "p2trScriptpath_percentage": "P2TR script-path"}
const dataType = dataTypePercentage
const unit = ""

const chartFunction = stackedAreaChart
