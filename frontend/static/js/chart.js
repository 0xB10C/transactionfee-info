var preProcessedData
var currentRollingAverage
var currentStartDate
var currentEndDate
var currentIsStepPlot
var currentIsAnnotations

const dataTypePercentage = 0
const dataTypeInteger = 1
const dataTypeFloat = 2
const dataTypePercentagePrecise = 3
const dataTypeMetric = 4
const dataTypeFloatMinutes = 5

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

const annotationBitcoinQTv0_6 = {'text': 'Bitcoin-QT v0.6 release', 'date': '2012-03-30'} // https://bitcoin.org/en/release/v0.6.0
const annotationBitcoinQTv0_7 = {'text': 'Bitcoin-QT v0.7 release', 'date': '2012-09-17'} // https://bitcoin.org/en/release/v0.7.0
const annotationBitcoinQTv0_8 = {'text': 'Bitcoin-QT v0.8 release', 'date': '2013-02-19'}
const annotationBitcoinCorev0_9 = {'text': 'Bitcoin Core v0.9.0 release', 'date': '2014-03-19'}
const annotationBitcoinCorev0_10 = {'text': 'Bitcoin Core v0.10.0 release', 'date': '2015-02-16'}
const annotationBIP66Activated = {'text': 'BIP66 Activation', 'date': '2015-07-04'}
const annotationBitcoinCorev0_11_1 = {'text': 'Bitcoin Core v0.11.1 release', 'date': '2015-10-15'}
const annotationBitcoinCoreSegWitWalletReleased = {'text': 'Bitcoin Core SegWit wallet released', 'date': '2018-02-26'}
const annotationSegWitActivated = {'text': 'SegWit Activation', 'date': '2017-08-24'}
const annotationBitcoinCorev0_17 = {'text': 'Bitcoin Core v0.17.0 release', 'date': '2018-10-03'}
const annotationBitcoinCorev0_19 = {'text': 'Bitcoin Core v0.19.0.1 release', 'date': '2019-11-24'}
const annotationBlockchainComSegwit = {'text': 'Blockchain.com wallet supports SegWit ', 'date': '2021-06-02'}
const annotationTaprootLockedIn = {'text': 'Taproot soft-fork locked-in', 'date': '2021-06-12'}
const annotationTaprootActivated = {'text': 'Taproot soft-fork activated', 'date': '2021-11-14'}
const annotationBitcoinCore23 = {'text': 'Bitcoin Core v23 released', 'date': '2022-04-25'}
const annotationChinaMiningBan = {'text': 'China mining ban', 'date': '2021-05-21'}


const DAYS31 = 2678400000

// movingAverage calculates a moving average of the _field_ value and returns
// the passed data array with field value modified to be a moving average over N
// entries. By default the field is "y". The date field remains unchanged.
function movingAverage(data, N, keys=["y"]) {
  let i = 0;
  var sums = {}
  var avg = []

  for (const el of data) {
    avg.push(Object.assign({}, el))
  }


  // fill the sums dict with zeros for each key
  for (const key of keys) {
    sums[key] = 0;
  }

  // start by calculating the sum for the N first entries (or data.length first
  // entries) for each key
  for (let n = Math.min(N - 1, data.length); i < n; ++i) {
    for (const key of keys) {
      sums[key] += data[i][key];
    }
  }

  // calculate the moving average over N entries by starting with the sum from
  // above for each key
  for (let n = data.length; i < n; ++i) {
    for (const key of keys) {
      sums[key] += data[i][key];
      avg[i][key] = sums[key] / N;
      sums[key] -= data[i - N + 1][key];
    }
  }
  return avg;
}

// setDescriptionTimeframe expects an array with two date object entries representing
// the start date and end date of the currently shown data.
function setDescriptionTimeframe(timeframe) {
  d3.select("#description-timeframe-start").text(timeframe[0].toLocaleDateString())
  d3.select("#description-timeframe-end").text(timeframe[1].toLocaleDateString())
}

// setDescriptionRollingAverage expects an integer
function setDescriptionRollingAverageUnit(rollingAvg) {
  if (rollingAvg == 1) {
    document.getElementById("rolling-average-unit").textContent = "day";
  } else {
    document.getElementById("rolling-average-unit").textContent = "days";
  }
}

function setDescriptionLegend(keys, labels, colors, reverse = false) {
  d3.select("#description-legend").selectAll("*").remove();

  _keys = [...keys]
  if (reverse) {
    _keys = _keys.reverse()
  }

  for (const key of _keys) {
    var legendElement = d3.select("#description-legend").append("span")
      .attr("class", "p-1 text-nowrap")

    legendElement.append("span").text("")
      .style("background-color", d3.color(colors[key]).copy({opacity: 0.6}))
      .style("height", "1em")
      .style("width", "1em")
      .style("border-radius", "50%")
      .style("display", "inline-block")
      .attr("class", "mx-1");

    legendElement.append("span").text(labels[key]).style("height", "1em");
  }
}

function drawAnnotations(annotations, focus, annotationLine) {

  if (annotations.length == 0) {
    document.getElementById("annotations-box").style.display = "none";
  }

  if (!currentIsAnnotations) return;

  for (const annotation of annotations) {
    annoData = [
      {"date": d3.timeParse("%Y-%m-%d")(annotation.date), "y": height},
      {"date": d3.timeParse("%Y-%m-%d")(annotation.date), "y": 0}
    ]

    focus.append("path")
      .datum(annoData)
      .attr("class", "annotationLine")
      .attr("fill", "none")
      .attr("stroke", colorGRAY)
      .attr("clip-path","url(#chart-clip)")
      .attr("stroke-width", 1)
      .attr("d", annotationLine)

    focus.append("text")
      .datum(annoData[0])
      .attr("class", "annotationText")
      .attr("fill", colorDARKGRAY)
      .text(" " + annoData[0].date.toLocaleDateString() + ": " + annotation.text + " ")
      .attr("text-anchor", "end")
      .attr("y", "-.3em");

  }
}

var chartWrapper = document.getElementById("chart-wrapper")

var margin = {top: 5, right: 0, bottom: 70, left: 50},
  marginBrush = {top: 550, right: margin.right, bottom: 30, left: margin.left},
  width = +chartWrapper.clientWidth - margin.left - margin.right,
  height = +chartWrapper.clientHeight - margin.top - margin.bottom,
  heightBrush = +chartWrapper.clientHeight - marginBrush.top - marginBrush.bottom;

var xScale = d3.scaleTime().range([0, width]),
  xScaleBrush = d3.scaleTime().range([0, width]),
  yScale = d3.scaleLinear().range([height, 0]),
  yScaleBrush = d3.scaleLinear().range([heightBrush, 0]);

var xAxis = d3.axisBottom(xScale),
  xAxisBrush = d3.axisTop(xScaleBrush).tickSize(0),
  yAxis = d3.axisLeft(yScale).tickFormat(d3.format("~s"));

var svg = d3.select("#chart")
  .attr("xmlns", 'http://www.w3.org/2000/svg')
  .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
  .attr("xml:space", "preserve")
  .attr("width", +chartWrapper.clientWidth)
  .attr("height", +chartWrapper.clientHeight);

var tooltip = d3.select("#tooltip")
  .style("position", "absolute")
  .style("pointer-events","none")
  .style("background","white")
  .style("max-width","250px");

svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height);

svg.append("g")
  .append("svg:image")
  .attr("y","20%")
  .attr("x","50%")
  .attr("transform", "translate(-130 0)")
  .attr("opacity", "0.37")
  .attr("xlink:href", "/img/logo.svg")

var focus = svg.append("g")
  .attr("class", "focus")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

var context = svg.append("g")
  .attr("class", "context")
  .attr("transform", "translate(" + marginBrush.left + "," + marginBrush.top + ")");


// For the thumbnails a PNG generated from the chart is used. This function can
// be called from a browser JS console to download the current chart as an PNG.
function generatePNG(filename) {
  canvasNode = d3.select("body").append("canvas")
    .style('display', 'none')
    .attr('width', width-5)
    .attr('height', height)
    .node();

  var ctx = canvasNode.getContext('2d');
  var img = new Image();

  img.onload = function() {
    ctx.drawImage(img, -margin.left -3, -margin.top);
    var url = canvasNode.toDataURL('image/png');
    a = d3.select("#thumbnail-download").node()
    a.href = url;
    a.download = filename;
    a.text = "save-me"
  }

  img.src = "data:image/svg+xml," + encodeURIComponent(svg.node().parentNode.innerHTML);
  canvasNode.remove()
}

window.onload = function () {
  let queryValues = readQueryString()

  // set the starting values
  document.getElementById('rolling-average-input').value = queryValues[queryParameterAvg] || chartRollingAverage;
  currentRollingAverage = queryValues[queryParameterAvg] ||  chartRollingAverage;
  currentIsAnnotations =  queryValues[queryParameterAnnotations] == "true" || true
  currentIsStepPlot = queryValues[queryParameterStep] == "true" || false

  document.getElementById("step-plot-input").checked = currentIsStepPlot
  document.getElementById("annotations-input").checked = currentIsAnnotations

  Promise.all(CSVs).then(function(data) {
    preProcessedData = preprocess(data)

    currentEndDate = d3.timeParse("%Y-%m-%d")(queryValues[queryParameterEnd]) || d3.max(preProcessedData, d => d.date)

    // if startDate is defined then use that, otherwise used now-2years
    if (typeof startDate != "undefined") {
      currentStartDate = d3.timeParse("%Y-%m-%d")(queryValues[queryParameterStart]) || startDate
    } else {
      currentStartDate = d3.timeParse("%Y-%m-%d")(queryValues[queryParameterStart]) || new Date(currentEndDate).setFullYear(currentEndDate.getFullYear() - 2)
    }

    draw()
  });

  d3.select("#rolling-average-input").on("change", function() {
    currentRollingAverage = this.value
    setDescriptionRollingAverageUnit(currentRollingAverage)
    draw()
  });

  d3.select("#step-plot-input").on("change", function() {
    currentIsStepPlot = this.checked
    draw()
  });

  d3.select("#annotations-input").on("change", function() {
    currentIsAnnotations = this.checked
    draw()
  });

  d3.select("#permalink-input").on("click", function() {
    let permalink = generatePermaLink();
    window.prompt("Permalink to this chart with these settings:", permalink);
  });
}

// draw loads the CSVs, preprocessed the data and then passes it to the
// specified chartFunction to render it.
function draw(){
  setDescriptionRollingAverageUnit(currentRollingAverage)
  chartFunction()
}

function lineWithAreaChart() {
  // defaults
  keys = ["y"]
  colors = {"y": "white"}

  data = movingAverage(preProcessedData, currentRollingAverage, keys)

  focus.selectAll("*").remove();
  context.selectAll("*").remove();

  focus.append("clipPath")
    .attr("id", "chart-clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  // functions for x and y values
  var xValue = (d => d.date);
  var yValue = (d => d.y);

  // functions for scaled x and y values
  var xScaledValue = (d => xScale(xValue(d)))
  var yScaledValue = (d => yScale(yValue(d)))

  var brush = d3.brushX()
    .extent([[0, 0], [width, heightBrush]])
    .on("end", brushed);

  var line = d3.line()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y(d => yScaledValue(d));

  var area = d3.area()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y0(height)
    .y1(d => yScaledValue(d));

  var annotationLine = d3.line()
    .x(d => xScaledValue(d))
    .y(d => d.y)

  xScale.domain(d3.extent(data, d => xValue(d) ));
  yScale.domain(d3.extent(data, d => yValue(d) ));
  xScaleBrush.domain(xScale.domain());
  yScaleBrush.domain(yScale.domain());

  // x-axis main chart
  focus.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // y-axis main chart
  focus.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);

  // line in main chart
  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", colorBLUE)
    .attr("clip-path","url(#chart-clip)")
    .attr("stroke-width", 2)
    .attr("d", line)

  // area in main chart
  focus.append("path")
    .datum(data)
    .attr("fill",  colorBLUE)
    .attr("opacity", 0.2)
    .attr("class", "area")
    .attr("clip-path","url(#chart-clip)")
    .attr("d", area);

  drawAnnotations(annotations, focus, annotationLine)

  // x-axis for brush
  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + heightBrush + ")")
    .style("opacity", 0.5)
    .call(xAxisBrush);

    // adds an invisible overlay to register mouse actions on
  focus.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseout", _ => tooltip.transition().duration(1).style("opacity", 0))
    .on("mousemove", mousemove);

  bisectDate = d3.bisector(function(d) { return d.date; }).left;

  function mousemove() {
    let x0 = xScale.invert(d3.mouse(this)[0])
    let i = bisectDate(data, x0, 1)
    let d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.year > d1.year - x0 ? d1 : d0;

    let doc = document.documentElement;
    let left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    let top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    let chartPos = chartWrapper.getBoundingClientRect();

    let yPos = d3.mouse(this)[1] + chartPos.y + top + 20
    let xPos = d3.mouse(this)[0] + chartPos.x + left + 60

    // switch tooltip position to the left side when on the right half of the chart
    let docWidth = (document.width !== undefined) ? document.width : document.body.offsetWidth
    if (xPos >= docWidth/2) (xPos -= tooltip.node().clientWidth)

    tooltip.html(formatTooltip(d))
    tooltip.transition().duration(5).style("left", xPos + "px").style("top", yPos + "px").style("opacity", 1);
  }

  // brush
  context.append("g")
    .attr("class", "brush")
    .attr("fill", "none")
    .call(brush)
    .call(brush.move, [currentStartDate, currentEndDate].map(xScale));

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || xScaleBrush.range();
    xScale.domain(s.map(xScaleBrush.invert, xScaleBrush));
    yScale.domain(yDomain(preProcessedData))

    setDescriptionTimeframe(xScale.domain())

    // update the current date variables
    currentStartDate = xScale.domain()[0]
    currentEndDate = xScale.domain()[1]

    focus.select(".line").attr("d", line);
    focus.select(".area").attr("d", area);
    focus.selectAll(".annotationLine").attr("d", annotationLine)
    focus.selectAll(".annotationText").attr("transform", d => {return "translate(" + xScaledValue(d) + " 5) rotate(-90)"})
    focus.select(".axis--x").call(xAxis);
    focus.select(".axis--y").call(yAxis);
  }
}

function stackedAreaChart() {
  data = movingAverage(preProcessedData, currentRollingAverage, keys)

  focus.selectAll("*").remove();
  context.selectAll("*").remove();

  focus.append("clipPath")
    .attr("id", "chart-clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  // functions for x and y values
  var xValue = (d => d.date);
  var yValue = (d => d.y);

  // functions for scaled x and y values
  var xScaledValue = (d => xScale(xValue(d)))
  var yScaledValue = (d => yScale(yValue(d)))

  yAxis.tickFormat(d3.format("~p"));

  var brush = d3.brushX()
    .extent([[0, 0], [width, heightBrush]])
    .on("end", brushed);

  var stackedArea = d3.area()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScale(d.data.date))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))

  var annotationLine = d3.line()
    .x(d => xScaledValue(d))
    .y(d => d.y)

  setDescriptionLegend(keys, labels, colors)

  var series = d3.stack().keys(keys)(data)

  xScale.domain(d3.extent(data, d => xValue(d) ));
  yScale.domain([0, 1])
  xScaleBrush.domain(xScale.domain());
  yScaleBrush.domain([0,1]);

  // x-axis main chart
  focus.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // y-axis main chart
  focus.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);

  // stacked area
  focus.append("g")
    .selectAll("path")
    .data(series)
    .join("path")
      .attr("class", "stackedArea")
      .attr("fill", ({key}) => colors[key])
      .attr("fill-opacity", 0.6)
      .attr("d", stackedArea)
      .attr("clip-path","url(#chart-clip)")
    .append("title")
      .text(({key}) => key);

  drawAnnotations(annotations, focus, annotationLine)

  // x-axis for brush
  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + heightBrush + ")")
    .style("opacity", 0.5)
    .call(xAxisBrush);

  var tooltipLine = focus.append("line")
    .attr("y1", height)
    .attr("y0", 0)
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("stroke", "black")
    .attr("stroke-width", "1")
    .style("opacity", 0);

  // adds an invisible overlay to register mouse actions on
  focus.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseout", hideTooltip)
    .on("mousemove", mousemove);

  function hideTooltip() {
    tooltip.transition().duration(1).style("opacity", 0)
    tooltipLine.transition().duration(1).style("opacity", 0)
  }

  bisectDate = d3.bisector(function(d) { return d.date; }).left;

  function mousemove() {
    let x0 = xScale.invert(d3.mouse(this)[0])
    let i = bisectDate(data, x0, 1)
    let d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.year > d1.year - x0 ? d1 : d0;

    tooltipLine.attr("transform", "translate(" + xScale(d.date) + "," + 0 + ")")

    let doc = document.documentElement;
    let left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    let top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    let chartPos = chartWrapper.getBoundingClientRect();

    let yPos = d3.mouse(this)[1] + chartPos.y + top + 30
    let xPos = d3.mouse(this)[0] + chartPos.x + left + 60

    // switch tooltip position to the left side when on the right half of the chart
    let docWidth = (document.width !== undefined) ? document.width : document.body.offsetWidth
    if (xPos >= docWidth/2) (xPos -= tooltip.node().clientWidth)

    tooltip.html(formatTooltip(d))
    tooltip.transition().duration(5).style("left", xPos + "px").style("top", yPos + "px").style("opacity", 1);
    tooltipLine.transition().duration(1).style("opacity", 0.3);
  }

  // brush
  context.append("g")
    .attr("class", "brush")
    .attr("fill", "none")
    .call(brush)
    .call(brush.move, [currentStartDate, currentEndDate].map(xScale));

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || xScaleBrush.range();
    xScale.domain(s.map(xScaleBrush.invert, xScaleBrush));
    setDescriptionTimeframe(xScale.domain())

    // update the current date variables
    currentStartDate = xScale.domain()[0]
    currentEndDate = xScale.domain()[1]

    focus.selectAll(".stackedArea").attr("d", stackedArea);
    focus.selectAll(".annotationLine").attr("d", annotationLine)
    focus.selectAll(".annotationText").attr("transform", d => {return "translate(" + xScaledValue(d) + " 5) rotate(-90)"})
    focus.select(".axis--x").call(xAxis);
    focus.select(".axis--y").call(yAxis);
  }

}

function twoLineChart() {
  // defaults
  keys = ["y1", "y2"]
  colors = {"y1": "#b10c00", "y2": "#0058cf"}

  data = movingAverage(preProcessedData, currentRollingAverage, keys)

  focus.selectAll("*").remove();
  context.selectAll("*").remove();

  focus.append("clipPath")
    .attr("id", "chart-clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  // functions for x and y values
  var xValue = (d => d.date);
  var yValue = (d => d.y);
  var yValueInputs = (d => d.y1);
  var yValueOutputs = (d => d.y2);

  // functions for scaled x and y values
  var xScaledValue = (d => xScale(xValue(d)))
  var yScaledValue = (d => yScale(yValue(d)))

  var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? Math.max(yValueOutputs(d), yValueInputs(d))  : 0)])

  var brush = d3.brushX()
    .extent([[0, 0], [width, heightBrush]])
    .on("end", brushed);

  var lineY1 = d3.line()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y(d => yScale(yValueInputs(d)));

  var lineY2 = d3.line()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y(d => yScale(yValueOutputs(d)));

  var annotationLine = d3.line()
    .x(d => xScaledValue(d))
    .y(d => d.y)

  setDescriptionLegend(keys, labels, colors)

  xScale.domain(d3.extent(data, d => xValue(d)));
  yScale.domain(d3.extent(data, d => yValueOutputs(d)));
  xScaleBrush.domain(xScale.domain());

  // x-axis main chart
  focus.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // y-axis main chart
  focus.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);

  // line y1 in main chart
  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", "lineY1")
    .attr("fill", "none")
    .attr("stroke", colors[keys[0]])
    .attr("stroke-width", 2)
    .attr("clip-path","url(#chart-clip)")
    .attr("d", lineY1)
  // line y2 in main chart
  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", "lineY2")
    .attr("fill", "none")
    .attr("stroke", colors[keys[1]])
    .attr("stroke-width", 2)
    .attr("clip-path","url(#chart-clip)")
    .attr("d", lineY2)

  drawAnnotations(annotations, focus, annotationLine)

  // x-axis for brush
  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + heightBrush + ")")
    .style("opacity", 0.5)
    .call(xAxisBrush);

  // adds an invisible overlay to register mouse actions on
  focus.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseout", _ => tooltip.transition().duration(1).style("opacity", 0))
    .on("mousemove", mousemove);

  bisectDate = d3.bisector(function(d) { return d.date; }).left;

  function mousemove() {
    let x0 = xScale.invert(d3.mouse(this)[0])
    let i = bisectDate(data, x0, 1)
    let d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.year > d1.year - x0 ? d1 : d0;

    let doc = document.documentElement;
    let left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    let top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    let chartPos = chartWrapper.getBoundingClientRect();

    let yPos = d3.mouse(this)[1] + chartPos.y + top + 20
    let xPos = d3.mouse(this)[0] + chartPos.x + left + 60

    // switch tooltip position to the left side when on the right half of the chart
    let docWidth = (document.width !== undefined) ? document.width : document.body.offsetWidth
    if (xPos >= docWidth/2) (xPos -= tooltip.node().clientWidth)

    tooltip.html(formatTooltip(d))
    tooltip.transition().duration(5).style("left", xPos + "px").style("top", yPos + "px").style("opacity", 1);
  }

  // brush
  context.append("g")
    .attr("class", "brush")
    .attr("fill", "none")
    .call(brush)
    .call(brush.move, [currentStartDate, currentEndDate].map(xScale));

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || xScaleBrush.range();
    xScale.domain(s.map(xScaleBrush.invert, xScaleBrush));
    yScale.domain(yDomain(preProcessedData));
    setDescriptionTimeframe(xScale.domain())

    // update the current date variables
    currentStartDate = xScale.domain()[0]
    currentEndDate = xScale.domain()[1]

    focus.select("#lineY1").attr("d", lineY1);
    focus.select("#lineY2").attr("d", lineY2);
    focus.selectAll(".annotationLine").attr("d", annotationLine)
    focus.selectAll(".annotationText").attr("transform", d => {return "translate(" + xScaledValue(d) + " 5) rotate(-90)"})
    focus.select(".axis--x").call(xAxis);
    focus.select(".axis--y").call(yAxis);
  }
}

function fiveLineChart() {
  // defaults
  keys = ["y1", "y2", "y3", "y4", "y5"]
  colors = {"y5": colorBLUE, "y4": colorORANGE, "y3": colorPURPLE, "y2": colorYELLOW, "y1": colorAQUA}

  data = movingAverage(preProcessedData, currentRollingAverage, keys)

  focus.selectAll("*").remove();
  context.selectAll("*").remove();

  focus.append("clipPath")
    .attr("id", "chart-clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  // functions for x and y values
  var xValue = (d => d.date);
  var yValue = (d => d.y);
  var yValue1 = (d => d.y1);
  var yValue2 = (d => d.y2);
  var yValue3 = (d => d.y3);
  var yValue4 = (d => d.y4);
  var yValue5 = (d => d.y5);

  // functions for scaled x and y values
  var xScaledValue = (d => xScale(xValue(d)))
  var yScaledValue = (d => yScale(yValue(d)))

  var yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? Math.max(
    yValue1(d),
    yValue2(d),
    yValue3(d),
    yValue4(d),
    yValue5(d),
  )  : 0)])

  var brush = d3.brushX()
    .extent([[0, 0], [width, heightBrush]])
    .on("end", brushed);

  var lineY1 = d3.line()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y(d => yScale(yValue1(d)));
  var lineY2 = d3.line()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y(d => yScale(yValue2(d)));
  var lineY3 = d3.line()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y(d => yScale(yValue3(d)));
  var lineY4 = d3.line()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y(d => yScale(yValue4(d)));
  var lineY5 = d3.line()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y(d => yScale(yValue5(d)));

  var annotationLine = d3.line()
    .x(d => xScaledValue(d))
    .y(d => d.y)

  setDescriptionLegend(keys, labels, colors, true)

  xScale.domain(d3.extent(data, d => xValue(d)));
  yScale.domain(d3.extent(data, d => yValue5(d)));
  xScaleBrush.domain(xScale.domain());

  // x-axis main chart
  focus.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // y-axis main chart
  focus.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);

  // line y1 in main chart
  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", "lineY1")
    .attr("fill", "none")
    .attr("stroke", colors[keys[0]])
    .attr("stroke-width", 2)
    .attr("clip-path","url(#chart-clip)")
    .attr("d", lineY1)
  // line y2 in main chart
  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", "lineY2")
    .attr("fill", "none")
    .attr("stroke", colors[keys[1]])
    .attr("stroke-width", 2)
    .attr("clip-path","url(#chart-clip)")
    .attr("d", lineY2)
  // line y3 in main chart
  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", "lineY3")
    .attr("fill", "none")
    .attr("stroke", colors[keys[2]])
    .attr("stroke-width", 2)
    .attr("clip-path","url(#chart-clip)")
    .attr("d", lineY3)
  // line y4 in main chart
  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", "lineY4")
    .attr("fill", "none")
    .attr("stroke", colors[keys[3]])
    .attr("stroke-width", 2)
    .attr("clip-path","url(#chart-clip)")
    .attr("d", lineY4)
  // line y5 in main chart
  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", "lineY5")
    .attr("fill", "none")
    .attr("stroke", colors[keys[4]])
    .attr("stroke-width", 2)
    .attr("clip-path","url(#chart-clip)")
    .attr("d", lineY5)

  drawAnnotations(annotations, focus, annotationLine)

  // x-axis for brush
  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + heightBrush + ")")
    .style("opacity", 0.5)
    .call(xAxisBrush);

  // adds an invisible overlay to register mouse actions on
  focus.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseout", _ => tooltip.transition().duration(1).style("opacity", 0))
    .on("mousemove", mousemove);

  bisectDate = d3.bisector(function(d) { return d.date; }).left;

  function mousemove() {
    let x0 = xScale.invert(d3.mouse(this)[0])
    let i = bisectDate(data, x0, 1)
    let d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.year > d1.year - x0 ? d1 : d0;

    let doc = document.documentElement;
    let left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    let top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    let chartPos = chartWrapper.getBoundingClientRect();

    let yPos = d3.mouse(this)[1] + chartPos.y + top + 20
    let xPos = d3.mouse(this)[0] + chartPos.x + left + 60

    // switch tooltip position to the left side when on the right half of the chart
    let docWidth = (document.width !== undefined) ? document.width : document.body.offsetWidth
    if (xPos >= docWidth/2) (xPos -= tooltip.node().clientWidth)

    tooltip.html(formatTooltip(d))
    tooltip.transition().duration(5).style("left", xPos + "px").style("top", yPos + "px").style("opacity", 1);
  }

  // brush
  context.append("g")
    .attr("class", "brush")
    .attr("fill", "none")
    .call(brush)
    .call(brush.move, [currentStartDate, currentEndDate].map(xScale));

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || xScaleBrush.range();
    xScale.domain(s.map(xScaleBrush.invert, xScaleBrush));
    yScale.domain(yDomain(preProcessedData));
    setDescriptionTimeframe(xScale.domain())

    // update the current date variables
    currentStartDate = xScale.domain()[0]
    currentEndDate = xScale.domain()[1]

    focus.select("#lineY1").attr("d", lineY1);
    focus.select("#lineY2").attr("d", lineY2);
    focus.select("#lineY3").attr("d", lineY3);
    focus.select("#lineY4").attr("d", lineY4);
    focus.select("#lineY5").attr("d", lineY5);
    focus.selectAll(".annotationLine").attr("d", annotationLine)
    focus.selectAll(".annotationText").attr("transform", d => {return "translate(" + xScaledValue(d) + " 5) rotate(-90)"})
    focus.select(".axis--x").call(xAxis);
    focus.select(".axis--y").call(yAxis);
  }
}

function percentileChart() {
  // defaults
  keys = ["min", "v5thP", "v10thP", "v25thP", "v50thP", "v75thP", "v90thP", "v95thP"]
  labels = {"min": "minimum", "max": "maximum", "v5thP": "5th percentile", "v10thP": "10th percentile", "v25thP": "25th percentile", "v35thP": "35th percentile", "v50thP": "50th percentile", "v65thP": "65th percentile", "v75thP": "75th percentile", "v90thP": "90th percentile", "v95thP": "95th percentile" }
  colors = {"min": "#2a80ab", "v5thP": "#357fb5", "v10thP": "#487ebd", "v25thP": "#5e7bc3", "v35thP": "#7676c5", "v50thP": "#8e71c4", "v65thP": "#a56abf", "v75thP": "#bb61b6", "v90thP": "#cf58a9", "v95thP": "#df5098", "max": "#ec4985" }

  //[ "#f84959", "#f44670", "#ec4985", "#df5098", "#cf58a9", "#bb61b6", "#a56abf", "#8e71c4", "#7676c5", "#5e7bc3","#487ebd","#357fb5","#2a80ab"],

  data = movingAverage(preProcessedData, currentRollingAverage, keys)

  focus.selectAll("*").remove();
  context.selectAll("*").remove();

  focus.append("clipPath")
    .attr("id", "chart-clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  // functions for x and y values
  var xValue = (d => d.date);
  var yValue = (d => d.y);
  var yValueK = function(d, k) {return d[k]};

  // functions for scaled x and y values
  var xScaledValue = (d => xScale(xValue(d)))
  var yScaledValue = (d => yScale(yValue(d)))

  var yDomain = (data => [0,
    d3.max(data, d =>
      (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date)
        ? yValueK(d, "v95thP") : 0)])

  var brush = d3.brushX()
    .extent([[0, 0], [width, heightBrush]])
    .on("end", brushed);

  var lines = {}
  for (i in keys) {
    lines[keys[i]] = d3.line()
      .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
      .x(d => xScaledValue(d))
      .y(d => yScale(yValueK(d, keys[i])));
  }

  var annotationLine = d3.line()
    .x(d => xScaledValue(d))
    .y(d => d.y)

  setDescriptionLegend(keys, labels, colors)

  xScale.domain(d3.extent(data, d => xValue(d)));
  yScale.domain(d3.extent(data, d => yValueK(d, "max")));
  xScaleBrush.domain(xScale.domain());

  // x-axis main chart
  focus.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // y-axis main chart
  focus.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);

  for(const [key, line] of Object.entries(lines)) {
      focus.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("id", "line-"+key)
        .attr("fill", "none")
        .attr("stroke", colors[key])
        .attr("stroke-width", 2)
        .attr("clip-path","url(#chart-clip)")
        .attr("d", line)
  }

  drawAnnotations(annotations, focus, annotationLine)

  // x-axis for brush
  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + heightBrush + ")")
    .style("opacity", 0.5)
    .call(xAxisBrush);

  // adds an invisible overlay to register mouse actions on
  focus.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseout", _ => tooltip.transition().duration(1).style("opacity", 0))
    .on("mousemove", mousemove);

  bisectDate = d3.bisector(function(d) { return d.date; }).left;

  function mousemove() {
    let x0 = xScale.invert(d3.mouse(this)[0])
    let i = bisectDate(data, x0, 1)
    let d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.year > d1.year - x0 ? d1 : d0;

    let doc = document.documentElement;
    let left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    let top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    let chartPos = chartWrapper.getBoundingClientRect();

    let yPos = d3.mouse(this)[1] + chartPos.y + top + 20
    let xPos = d3.mouse(this)[0] + chartPos.x + left + 60

    // switch tooltip position to the left side when on the right half of the chart
    let docWidth = (document.width !== undefined) ? document.width : document.body.offsetWidth
    if (xPos >= docWidth/2) (xPos -= tooltip.node().clientWidth)

    tooltip.html(formatTooltip(d))
    tooltip.transition().duration(5).style("left", xPos + "px").style("top", yPos + "px").style("opacity", 1);
  }

  // brush
  context.append("g")
    .attr("class", "brush")
    .attr("fill", "none")
    .call(brush)
    .call(brush.move, [currentStartDate, currentEndDate].map(xScale));

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || xScaleBrush.range();
    xScale.domain(s.map(xScaleBrush.invert, xScaleBrush));
    yScale.domain(yDomain(data));
    setDescriptionTimeframe(xScale.domain())

    // update the current date variables
    currentStartDate = xScale.domain()[0]
    currentEndDate = xScale.domain()[1]

    for (i in keys) {
      focus.select("#line-"+keys[i]).attr("d", lines[keys[i]]);
    }
    focus.selectAll(".annotationLine").attr("d", annotationLine)
    focus.selectAll(".annotationText").attr("transform", d => {return "translate(" + xScaledValue(d) + " 5) rotate(-90)"})
    focus.select(".axis--x").call(xAxis);
    focus.select(".axis--y").call(yAxis);
  }
}

function toYYYY_MM_DDString(d) {
  return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2)
}

function formatTooltipTableRow(name, value, color="white") {
  return `<tr><td style="background: ${color}" >${name}</td><td class="text-right">${value}</td></tr>\n`
}

function formatTooltip(d){

  let tooltipTableInner = ""
  tooltipTableInner += formatTooltipTableRow("Date", d.date.toLocaleDateString())

  for (const key of [...keys].reverse()) {
    if (d.hasOwnProperty(key)) {
      switch (dataType) {
        case dataTypePercentage:
          tooltipTableInner += formatTooltipTableRow(labels[key], d3.format(".0%")(d[key]), d3.color(colors[key]).copy({opacity: 0.6}))
          break;
        case dataTypePercentagePrecise:
          tooltipTableInner += formatTooltipTableRow(labels[key], d3.format(".4%")(d[key]), d3.color(colors[key]).copy({opacity: 0.6}))
          break;
        case dataTypeInteger:
          tooltipTableInner += formatTooltipTableRow(labels[key], d3.format(".0f")(d[key]) + " " + unit, d3.color(colors[key]).copy({opacity: 0.6}))
          break;
        case dataTypeMetric:
          tooltipTableInner += formatTooltipTableRow(labels[key], d3.format("~s")(d[key]) + "" + unit, d3.color(colors[key]).copy({opacity: 0.6}))
          break;
        case dataTypeFloatMinutes:
          tooltipTableInner += formatTooltipTableRow(labels[key], d3.utcFormat("%M:%S")(d[key] * 60 * 1000) + "   " + unit, d3.color(colors[key]).copy({opacity: 0.6}))
          break;
        case dataTypeFloat:
          tooltipTableInner += formatTooltipTableRow(labels[key], d3.format(".2f")(d[key]) + " " + unit, d3.color(colors[key]).copy({opacity: 0.6}))
          break;
        default:
          break;
      }
    }
  }

  return `<div><table class="table table-sm p-0 m-0" style="font-size: 0.75em;">
    <tbody>
      ${tooltipTableInner}</tbody></table></div>
  `
}

const queryParameterAvg = "avg"
const queryParameterStep = "step"
const queryParameterStart = "start"
const queryParameterEnd = "end"
const queryParameterAnnotations = "annotation"

function readQueryString() {
  let params = new URLSearchParams(window.location.search);

  return {
    "avg": params.get(queryParameterAvg),
    "step": params.get(queryParameterStep),
    "start": params.get(queryParameterStart),
    "end": params.get(queryParameterEnd),
    "annotation": params.get(queryParameterAnnotations)
  }
}

function generatePermaLink() {
  let params = new URLSearchParams(window.location.search);

  if (currentRollingAverage != chartRollingAverage) params.set(queryParameterAvg, currentRollingAverage)
  if (currentIsAnnotations != true) params.set(queryParameterAnnotations, false)
  if (currentIsStepPlot != false) params.set(queryParameterStep, true)
  params.set(queryParameterStart, toYYYY_MM_DDString(currentStartDate))
  params.set(queryParameterEnd, toYYYY_MM_DDString(currentEndDate))

  return window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.toString()
}
