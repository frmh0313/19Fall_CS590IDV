let dataSet;

function* years() {
  let i = 70;
  while (i <= 82) {
    yield i++;
  }
}

async function drawChart() {
  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 600,
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

  dataSet = await d3.csv("./old_cars.csv");
  console.log(dataSet);

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataSet.map(row => +row.Horsepower))])
    .range([dimensions.boundedHeight, 0]);

  const yAxisGenerator = d3.axisLeft(yScale);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  yAxisLabel = yAxis
    .append("text")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .attr("fill", "black")
    .style("font-size", "1.4em")
    .text("Horsepower")
    .style("transform", "rotate(-90deg)")
    .style("text-anchor", "middle");

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataSet.map(row => +row.MPG))])
    .range([0, dimensions.boundedWidth]);

  const xAxisGenerator = d3.axisBottom(xScale);

  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  const xAxisLabel = xAxis
    .append("text")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .attr("font-size", "1.4em")
    .text("MPG");

  // generated using https://hihayk.github.io/scale/
  let schemeCategory13 = [
    "#d8eecc",
    "#b4e2aa",
    "#88d588",
    "#66c770",
    "#44B968",
    "#22aa67",
    "#009a6C",
    "#009077",
    "#00877f",
    "#00747d",
    "#005c72",
    "#004668",
    "#00335d",
    "#002252"
  ];

  const color = d3
    .scaleOrdinal()
    .domain([...years()])
    .range(schemeCategory13);

  const dots = bounds
    .selectAll("circle")
    .data(dataSet)
    .join("circle")
    .attr("cx", d => xScale(+d.MPG))
    .attr("cy", d => yScale(+d.Horsepower))
    .attr("r", 5)
    .attr("fill", d => color(+d.Model));
  // .attr("fill", color);

  const legend = bounds
    .append("g")
    .attr("transform", `translate(${dimensions.boundedWidth}, 0)`)
    .attr("text-anchor", "end")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("g")
    .data(color.domain().slice())
    .join("g")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legend
    .append("rect")
    .attr("x", -19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", color);

  legend
    .append("text")
    .attr("x", -24)
    .attr("y", 9.5)
    .attr("dy", "0.35em")
    .text(d => d);
}

drawChart();
