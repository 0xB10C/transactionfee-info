/* Shared code to load data and render charts */

var chart
var preProcessedData


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
  console.log(chart.getOption());
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
