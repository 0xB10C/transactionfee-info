const chartRollingAverage = 7

const CSVs = [
  d3.csv("/csv/date.csv"),
  d3.csv("/csv/Payments_sum.csv"),
  d3.csv("/csv/Size_avg.csv"),
];

/*------------------------------------------------------------------------------
  The Payments per block-size chart is a special case, because uses two y-axis.
  One for the number of Payments and one for the block-size.
------------------------------------------------------------------------------*/

function preprocess(data) {
  combinedData = []
  for (let i = 0; i < data[0].length; i++) {
    const date = d3.timeParse("%Y-%m-%d")(data[0][i].date)
    const y1 = parseFloat(data[1][i].Payments_sum)
    const y2 = parseFloat(data[2][i].Size_avg) / 1000 
    combinedData.push({date, y1, y2})
  }
  return combinedData
}

const keys = ["y1", "y2"]
const colors = {"y1": colorBLUE, "y2": colorGRAY}
const labels = {"y1": "Payments", "y2": "Block size in KB"}
const dataType = dataTypeInteger
const annotations = [annotationSegWitActivated]
const unit = ""

const chartFunction = twoYAxisChartSpecial;


function twoYAxisChartSpecial() {

  focus.selectAll("*").remove();
  context.selectAll("*").remove();
  
  focus.append("clipPath")
    .attr("id", "chart-clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  data = movingAverage(preProcessedData, currentRollingAverage, keys)
  var y2Scale = d3.scaleLinear().range([height, 0]);
  var yAxisRight = d3.axisLeft(y2Scale);

  yAxisRight.tickFormat(d3.format(".2s"));
  yAxisRight.tickFormat(d3.format(".2s"));

  // functions for x and y values
  var xValue = (d => d.date);
  var y1Value = (d => d.y1);
  var y2Value = (d => d.y2);

  // functions for scaled x and y values
  var xScaledValue = (d => xScale(xValue(d)))
  var y1ScaledValue = (d => yScale(y1Value(d)))
  var y2ScaledValue = (d => y2Scale(y2Value(d)))

  var y1Domain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? y1Value(d) : 0)])
  var y2Domain = (data => [0, d3.max(data, d => (xScale.domain()[0] <= d.date && xScale.domain()[1] > d.date) ? y2Value(d) : 0)])

  var brush = d3.brushX()
    .extent([[0, 0], [width, heightBrush]])
    .on("brush end", brushed);

  var lineY1 = d3.line()
    .x(d => xScaledValue(d))
    .y(d => y1ScaledValue(d));

  var lineY2 = d3.line()
    .x(d => xScaledValue(d))
    .y(d => y2ScaledValue(d));

  var areaY1 = d3.area()
    .x(d => xScaledValue(d))
    .y0(height)
    .y1(d => y1ScaledValue(d));

  var areaY2 = d3.area()
    .x(d => xScaledValue(d))
    .y0(height)
    .y1(d => y2ScaledValue(d));

  var annotationLine = d3.line()
    .x(d => xScaledValue(d))
    .y(d => d.y)

  drawAnnotations(annotations, focus, annotationLine)
  setDescriptionLegend(keys, labels, colors)

  xScale.domain(d3.extent(data, d => xValue(d) ));
  yScale.domain(y1Domain(data));
  y2Scale.domain(y2Domain(data));
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

  // y-axis-right main chart
  focus.append("g")
    .attr("class", "axis axis--y")
    .attr("transform", "translate(" + (width - margin.right) + ",0)")
    .call(yAxisRight);

  // line in main chart
  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", "lineY1")
    .attr("fill", "none")
    .attr("stroke", colors["y1"])
    .attr("clip-path","url(#chart-clip)")
    .attr("stroke-width", 2)
    .attr("d", lineY1)

  // line in main chart
  focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", "lineY2")
    .attr("fill", "none")
    .attr("stroke", colors["y2"])
    .attr("clip-path","url(#chart-clip)")
    .attr("stroke-width", 2)
    .attr("d", lineY2)

  // area in main chart
  focus.append("path")
    .datum(data)
    .attr("fill", colors["y1"])
    .attr("opacity", 0.2)
    .attr("class", "area")
    .attr("id", "areaY1")
    .attr("clip-path","url(#chart-clip)")
    .attr("d", areaY1);

  // area in main chart
  focus.append("path")
    .datum(data)
    .attr("fill", colors["y2"])
    .attr("opacity", 0.2)
    .attr("class", "area")
    .attr("id", "areaY2")
    .attr("clip-path","url(#chart-clip)")
    .attr("d", areaY2);

  // x-axis for brush
  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + heightBrush + ")")
    .call(xAxisBrush);

  dateMax = d3.max(data, d => xValue(d))
  dateTwoYearsAgo = new Date(dateMax).setFullYear(dateMax.getFullYear() - 2)

  // brush
  context.append("g")
    .attr("class", "brush")
    .attr("fill", "none")
    .call(brush)
    .call(brush.move, [currentStartDate, currentEndDate].map(xScale));


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

    tooltip.style("left", xPos + "px");
    tooltip.style("top", yPos + "px");
    tooltip.html(formatTooltip(d))
    tooltip.transition().duration(1).style("opacity", 1);
  }

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || xScaleBrush.range();
    xScale.domain(s.map(xScaleBrush.invert, xScaleBrush));
    yScale.domain(y1Domain(preProcessedData))
    y2Scale.domain(y2Domain(preProcessedData))
    setDescriptionTimeframe(xScale.domain())

    // update the current date variables
    currentStartDate = xScale.domain()[0]
    currentEndDate = xScale.domain()[1] 

    focus.select("#lineY1").attr("d", lineY1);
    focus.select("#areaY1").attr("d", areaY1);
    focus.select("#lineY2").attr("d", lineY2);
    focus.select("#areaY2").attr("d", areaY2);
    focus.select(".axis--x").call(xAxis);
    focus.select(".axis--y").call(yAxis);
    focus.select(".axis--y").call(yAxisRight);
  }
}