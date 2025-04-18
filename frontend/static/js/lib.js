/* Shared code to load data and render charts */

var chart
var preProcessedData

const colorNAVY = "#001f3f"
const colorBLUE = "#0074D9"
const colorAQUA = "#7FDBFF"
const colorTEAL = "#39CCCC"
const colorOLIVE = "#3D9970"
const colorGREEN = "#2ECC40"
const colorLIME = "#01FF70"
const colorYELLOW = "#FFDC00"
const colorORANGE = "#FF851B"
const colorRED = "#FF4136"
const colorMAROON = "#85144b"
const colorFUCHSIA = "#F012BE"
const colorPURPLE = "#B10DC9"
const colorBLACK = "#111111"
const colorDARKGRAY = "#444444"
const colorGRAY = "#AAAAAA"
const colorSILVER = "#DDDDDD"

const colorOPRETURN = colorLIME
const colorP2PK = colorGRAY
const colorP2PKH = colorRED
const colorNestedP2WPKH = colorAQUA
const colorP2WPKH = colorPURPLE
const colorP2MS = colorNAVY
const colorP2SH = colorYELLOW
const colorNestedP2WSH = colorORANGE
const colorP2WSH = colorBLUE
const colorP2TR = colorMAROON

const zip = (a, b) => a.map((k, i) => [k, b[i]]);

const watermark = (text) => { return { type: 'text', left: 'center', top: 'center', style: { text: text, font: 'bold 48px sans-serif', fill: 'rgba(0, 0, 0, 0.1)' }, z: 100, silent: true } };
const thumbnailTool = {
  show: isDevBuild,
  title: "save Thumbnail",
  icon: "path://M432.45,595.444c0,2.177-4.661,6.82-11.305,6.82c-6.475,0-11.306-4.567-11.306-6.82s4.852-6.812,11.306-6.812C427.841,588.632,432.452,593.191,432.45,595.444L432.45,595.444z M421.155,589.876c-3.009,0-5.448,2.495-5.448,5.572s2.439,5.572,5.448,5.572c3.01,0,5.449-2.495,5.449-5.572C426.604,592.371,424.165,589.876,421.155,589.876L421.155,589.876z M421.146,591.891c-1.916,0-3.47,1.589-3.47,3.549c0,1.959,1.554,3.548,3.47,3.548s3.469-1.589,3.469-3.548C424.614,593.479,423.062,591.891,421.146,591.891L421.146,591.891zM421.146,591.891",
  onclick: function (){
    safeThumbnail()
  }
}
const toolbox = () => {return { show: true, feature: { myThumbnailTool: thumbnailTool, dataZoom: { yAxisIndex: 'none' }, restore: {}, saveAsImage: { name: chartPNGFileName }, dataView: {}}}};

async function fetchCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  return parseCSV(text);
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

function movingAverage(data, windowSize, precision = 0) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      result.push(null); // not enough data yet
      continue;
    }
    const slice = data.slice(i - windowSize + 1, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    result.push((sum / windowSize).toFixed(precision));
  }
  return result;
}

async function draw(option) {
  chart = echarts.init(document.getElementById("chart"));
  chart.setOption(option);
}

function formatWithSIPrefix(value, unit="") {
  const si = [
    { value: 1e24, symbol: "Y" }, // yotta
    { value: 1e21, symbol: "Z" }, // zetta
    { value: 1e18, symbol: "E" }, // exa
    { value: 1e15, symbol: "P" }, // peta
    { value: 1e12, symbol: "T" }, // tera
    { value: 1e9,  symbol: "G" }, // giga
    { value: 1e6,  symbol: "M" }, // mega
    { value: 1e3,  symbol: "k" }, // kilo
  ];
  for (let i = 0; i < si.length; i++) {
    if (Math.abs(value) >= si[i].value) {
      return (value / si[i].value).toFixed(1).replace(/\.0$/, '') + " " + si[i].symbol + unit;
    }
  }
  return `${value} ${unit}`
}

function formatPercentage(v) {
  return v + "%";
}

function safeThumbnail() {
  draw({
    grid: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      containLabel: false
    },
    xAxis: { show: false },
    yAxis: { show: false },
    tooltip: { show: false },
    legend: { show: false },
    toolbox: { show: false },
    dataZoom: [{show: false}, {show: false}],
    graphic: {show: false},
    animation: false,
    animationDuration: 0,
  });
  const canvas = chart.getRenderedCanvas({
    backgroundColor: '#ffffff',
    pixelRatio: 2
  });

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = chartPNGFileName;
  link.click();
}

window.onload = function () {
  Promise.all(CSVs).then(function(data) {
    processedData = preprocess(data)
    let option = chartDefinition(processedData)
    draw(option)
  });
}
