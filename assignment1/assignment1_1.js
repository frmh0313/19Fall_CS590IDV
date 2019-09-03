// const d3 = require("d3");
"understanding description: three grouped bar charts associated with three origins.";
"Each grouped barchart shows the distribution of mpg of cars.";
"As the value of mpg, color changes";

// TODO
/*
1. Fix translate - remove gap within a same origin.
2. Discretization of range using different colors
3. Deciding and implementing Adequate width of each bar
4. Label
5. Legend
*/
let dataSet;

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

  dataSet = await d3.csv("./old_cars.csv").then(data =>
    data.map(row => {
      let carModel = `${row.Car}_${row.Model}`;
      row.Car = carModel;
      return row;
    })
  );

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper
    .append("g")
    .text("bounds group")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(d3.extent(dataSet.map(row => +row.MPG)))])
    .range([dimensions.boundedHeight, 0]);

  const xScale0 = d3
    .scaleLinear()
    .domain([0, d3.max(d3.extent(dataSet.map(r => +r.MPG)))])
    .range([0, dimensions.boundedWidth]);

  const xScale1 = d3
    .scaleBand()
    .domain(new Set(dataSet.map(r => r.Origin)))
    .range([0, xScale0.bandwidth()]);

  // const yAxisGenerator = d3.axisLeft().scale(yScale);
  const yAxisGenerator = d3.axisLeft(yScale);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  const xAxisGenerator = d3.axisBottom(xScale0);

  const color = d3
    .scaleOrdinal()
    .domain(new Set(dataSet.map(row => row.Origin)))
    .range(["red", "green", "blue"]);

  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  // working
  // bounds
  //   .selectAll("rect")
  //   .data(dataSet)
  //   .join("rect")
  //   .attr("x", d => xScale1(d.Car))
  //   .attr("y", d => yScale(d.MPG))
  //   .attr("width", xScale1.bandwidth())
  //   .attr("height", d => yScale(0) - yScale(d.MPG))
  //   .attr("fill", d => color(d.Origin))
  //   .attr("transform", d => `translate(${xScale0(d.Origin)}, 0)`);


  bounds.append("g")
  .text("group in bound")
  .selectAll("g")
  .data(dataSet)
  .join("g")
  .text((d, i) => `group in the group in bounds ${i}`)
  .style("transform", `translate(${xScale0(d.MPG)}, 0)`)
  .append("rect")
  .join("rect")
  .attr("x", d => xScale1(d.Origin))
  .attr("y", d => )



  // TODO
  // modify data to make it available for yScale
  // change y-Scale
  // add to bounds. 


  /*
  bounds
    .append("g")
    .text("group in bounds group")
    .selectAll("g")
    .data(dataSet)
    .join("g")
    .text((d, i) => `group in the group in bounds group ${i}`)
    .style("transform", d => `translate(${xScale0(d.Origin)}, 0)`)
    .append("rect")
    // .selectAll("rect")
    // .data(row => ({ Car: row.Car, MPG: +row.MPG, Origin: row.Origin }))
    // .data(d => d)
    .join("rect")
    .attr("x", d => xScale1(d.Car))
    .attr("y", d => yScale(d.MPG))
    // .attr("width", xScale1.bandwidth())
    .attr("width", 2)
    .attr("height", d => yScale(0) - yScale(d.MPG))
    .attr("fill", d => color(d.Origin));

  // return wrapper.node();
  // .append("rect")

  // bounds
  //   .append("g")
  //   .selectAll("g")
  //   .data(dataSet)
  //   .join("g")
  //   .attr("trasnform", d => `translate(${xScale0(d.Origin)}, 0)`);

  // bounds
  //   .selectAll("rect")
  //   .data(dataSet)
  //   .attr("x", d => xScale1(d.Car))
  //   .attr("y", d => yScale(d.MPG))
  //   .attr("width", xScale1.bandwidth())
  //   .attr("height", d => yScale(0) - yScale(d.MPG))
  //   .attr("fill", d => color(d.Origin));
  */
}

drawChart();
