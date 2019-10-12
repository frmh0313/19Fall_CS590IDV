let dataSet;

async function draw() {
  let dimensions = {
    width: 800,
    height: 700,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60
    }
  };

  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;

  dataSet = await d3.json("./USAir97v2.json").then(data => data);
  console.log(dataSet);

  const nodeData = dataSet.nodes;
  console.log("nodes: ", nodeData);
  const linkData = dataSet.links;

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const xAccessor = d => d.posx;
  const yAccessor = d => d.posy;

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(nodeData, xAccessor))
    .range([0, dimensions.boundedWidth]);

  console.log("xScale domain: ", xScale.domain());
  console.log("xScale range: ", xScale.range());

  const xAxisGenerator = d3.axisBottom(xScale);

  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  const xAxisLabel = xAxis
    .append("text")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.boundedHeight - 10)
    .attr("font-size", "1.4em")
    .text("x");

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(nodeData, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  console.log("yScale domain: ", yScale.domain());
  console.log("yScale range: ", yScale.range());

  const yAxisGenerator = d3.axisLeft(yScale);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  const yLabel = yAxis
    .append("text")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left)
    .attr("fill", "black")
    .attr("font-size", "1.4em")
    .text("y");

  const links = bounds
    .append("g")
    .selectAll("line")
    .data(linkData)
    .join("line")
    .attr("x1", d => xScale(nodeData[d.source - 1].posx))
    .attr("y1", d => yScale(nodeData[d.source - 1].posy))
    .attr("x2", d => xScale(nodeData[d.target - 1].posx))
    .attr("y2", d => yScale(nodeData[d.target - 1].posy))
    .attr("stroke", "#0055dd")
    .attr("stroke-width", 0.5)
    .attr("stroke-opacity", 1);

  const nodes = bounds
    .append("g")
    .selectAll("circle")
    .data(nodeData)
    .join("circle")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .attr("cx", d => xScale(xAccessor(d)))
    .attr("cy", d => yScale(yAccessor(d)))
    .attr("r", 5)
    .attr("fill", "black");
}

draw();
