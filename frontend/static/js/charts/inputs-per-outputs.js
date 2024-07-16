const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/inputs_sum.csv"),
  d3.csv("/csv/outputs_sum.csv"),
]

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y = parseFloat(data[1][i].inputs_sum) / parseFloat(data[2][i].outputs_sum)
    combinedData.push({date, y})
  }
  
  return combinedData
}

yAxis.tickFormat(d3.format(".2f"));
var yValue = (d => d.y);
const yDomain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? yValue(d) : 0)])

const keys = ["y"]
const colors = {"y": "white"}
const labels = {"y": "Inputs per Outputs"}
const dataType = dataTypeFloat
const unit = ""
const annotations = []

const chartFunction = lineWithAreaChartInputsPerOutputsSpecial;

/*------------------------------------------------------------------------------
  The Inputs per Outputs chart is a special case, because it has an extra marker
  at inputs/outputs = 1.
------------------------------------------------------------------------------*/

function lineWithAreaChartInputsPerOutputsSpecial() {
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
    .on("brush end", brushed);

  var line = d3.line()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y(d => yScaledValue(d));

  var area = d3.area()
    .curve(currentIsStepPlot ? d3.curveStep : d3.curveNatural)
    .x(d => xScaledValue(d))
    .y0(height)
    .y1(d => yScaledValue(d));

  // marks the position of equal inputs per outputs
  var rateMaker = d3.line()
    .x(d => xScaledValue(d))
    .y(_ => yScale(1));

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
    .attr("stroke", "#0058cf")
    .attr("clip-path","url(#chart-clip)")
    .attr("stroke-width", 2)
    .attr("d", line)

  // area in main chart
  focus.append("path")
    .datum(data)
    .attr("fill", "#0058cf")
    .attr("opacity", 0.2)
    .attr("class", "area")
    .attr("clip-path","url(#chart-clip)")
    .attr("d", area);

  // x-axis for brush
  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + heightBrush + ")")
    .call(xAxisBrush);

  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", "rateMaker")
    .attr("fill", "none")
    .attr("stroke", "gray")
    .attr("clip-path","url(#chart-clip)")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", 5)
    .attr("d", rateMaker);

  // adds an invisible overlay to register mouse actions on
  focus.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseout", _ => tooltip.transition().duration(1).style("opacity", 0))
    .on("mousemove", mousemove);

  drawAnnotations(annotations, focus, annotationLine)

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

    tooltip.style("left", xPos + "px");
    tooltip.style("top", yPos + "px");
    tooltip.html(formatTooltip(d))
    tooltip.transition().duration(1).style("opacity", 1);
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
    focus.select(".axis--x").call(xAxis);
    focus.select(".axis--y").call(yAxis);
    focus.select("#rateMaker").attr("d", rateMaker);
  }
}
