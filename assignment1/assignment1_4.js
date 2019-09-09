let origins = ["US", "Europe", "Japan"];
let columns = ["MPG", "Weight", "Horsepower", "Displacement"];
let dataSet;

// FOR debugging
function log(selection, msg) {
  console.log(msg, selection);
}
let x;
let yScale;

async function drawChart() {
  // let dimensions = {
  dimensions = {
    // width: window.innerWidth * 0.9,
    width: 964,
    padding: 20
  };

  dimensions.size =
    (dimensions.width - (columns.length + 1) * dimensions.padding) /
      columns.length +
    dimensions.padding;

  dataSet = await d3.csv("./old_cars.csv").then(data =>
    data.map(row => {
      row.MPG = +row.MPG;
      row.Displacement = +row.Displacement;
      row.Horsepower = +row.Horsepower;
      row.Weight = +row.Weight;
      return row;
    })
  );
  // console.log(dataSet);

  const svg = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.width)
    .attr(
      "viewBox",
      `${-dimensions.padding} 0 ${dimensions.width} ${dimensions.width}`
    )
    .style("max-width", "100%")
    .style("height", "auto");

  const cell = svg
    .append("g")
    .selectAll("g")
    .data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
    .join("g")
    .attr(
      "transform",
      ([i, j]) => `translate(${i * dimensions.size}, ${j * dimensions.size})`
    );

  // const xScale = columns.map(c =>

  x = columns.map(c =>
    d3
      .scaleLinear()
      .domain(d3.extent(dataSet, d => d[c]))
      .rangeRound([
        dimensions.padding / 2,
        dimensions.size - dimensions.padding / 2
      ])
  );

  /*
    xScale = columns.map(c =>
    d3
      .scaleLinear()
      .domain(d3.extent(dataSet, d => d[c]))
      .rangeRound([
        dimensions.padding / 2,
        dimensions.size - dimensions.padding / 2
      ])
  );
  */
  /*
  xAxisGenerator = g => {
    const axis = d3
      .axisBottom()
      .ticks(6)
      .tickSize(dimensions.size * columns.length);

    const newAxis = g
      .selectAll("g")
      .data(xScale)
      .join("g")
      .attr("transform", (d, i) => `translate(${i * dimensions.size}, 0)`)
      .each(d => d3.select(this).call(axis.scale(d)))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));
    return newAxis;
  };

  // xAxisGenerator = d3
  //   .axisBottom()
  //   .ticks(6)
  //   .tickSize(dimensions.size * columns.length);

  // xAxisGenerator = () => {
  //   const axis = d3
  //     .axisBottom()
  //     .ticks(6)
  //     .tickSize(dimensions.size * columns.length);

  //   return g =>
  //     g
  //       .selectAll("g")
  //       .data(xScale)
  //       .call(log, "xScale")
  //       .join("g")
  //       .call(log, "g")
  //       .attr("transform", (d, i) => `translate(${i * dimensions.size}, 0)`)
  //       .each(d => {
  //         let that = this;
  //         console.log(that);
  //         return d3.select(this).call(axis.scale(d));
  //       })
  //       .call(log, "each")
  //       .call(g => g.select(".domain").remove())
  //       .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));
  // };

  // const xAxis = bounds.append("g").call(xAxisGenerator);
  // const xAxis = bounds
  //   .append("g")
  //   .call(xAxisGenerator)
  //   .selectAll("g")
  //   .data(xScale)
  //   .join("g")
  //   .attr("transform", (d, i) => `translate(${i * dimensions.size)}, 0)`)
  //   .each(d => d3.select(this).call(axis.scale(d)))
*/
  const xAxis = function(g) {
    const axis = d3
      .axisBottom()
      .ticks(6)
      .tickSize(dimensions.size * columns.length);

    return g
      .selectAll("g")
      .data(x)
      .join("g")
      .attr("transform", (d, i) => `translate(${i * dimensions.size}, 0)`)
      .each(function(d) {
        return d3.select(this).call(axis.scale(d));
      })
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));
  };

  // const yScale = xScale.map(x => {
  y = x.map(x =>
    x
      .copy()
      .range([dimensions.size - dimensions.padding / 2, dimensions.padding / 2])
  );
  // yScale = xScale.map(x =>
  //   x
  //     .copy()
  //     .range([dimensions.size - dimensions.padding / 2, dimensions.padding / 2])
  // );

  /*
  const yAxis = function(g) {
    const axis = d3
      .axisLeft()
      .ticks(6)
      .tickSize(-dimensions.size * columns.length);

    return g
      .selectAll("g")
      .data(yScale)
      .join("g")
      .attr("transfrom", (d, i) => `translate(0, ${i * dimensions.size})`)
      .call(log, "y lines")
      .each(function(d) {
        return d3.select(this).call(axis.scale(d));
      })
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));
  };
*/

  const yAxis = function(g) {
    const axis = d3
      .axisLeft()
      .ticks(6)
      .tickSize(-dimensions.size * columns.length);
    return g
      .selectAll("g")
      .data(y)
      .join("g")
      .attr("transform", (d, i) => `translate(0,${i * dimensions.size})`)
      .each(function(d) {
        return d3.select(this).call(axis.scale(d));
      })
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));
  };
  const zScale = d3
    .scaleOrdinal()
    .domain(origins)
    .range(d3.schemeCategory10);

  cell
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("x", dimensions.padding / 2 + 0.5)
    .attr("y", dimensions.padding / 2 + 0.5)
    .attr("width", dimensions.size - dimensions.padding)
    .attr("height", dimensions.size - dimensions.padding);

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  cell.each(function([i, j]) {
    d3.select(this)
      .selectAll("circle")
      .data(dataSet)
      .join("circle")
      .attr("x", d => x[i](d[columns[i]]))
      .attr("y", d => y[i](d[columns[j]]));
  });

  const circle = cell
    .selectAll("circle")
    .attr("r", 3.5)
    .attr("fill-opacity", 0.7)
    .attr("fill", d => zScale(d.Origin));

  svg
    .append("g")
    .style("font", "bold 10px sans-serif")
    .selectAll("text")
    .data(columns)
    .join("text")
    .attr(
      "transform",
      (d, i) => `translate(${i * dimensions.size}, ${i * dimensions.size})`
    )
    .attr("x", dimensions.padding)
    .attr("y", dimensions.padding)
    .attr("dy", ".71em")
    .text(d => d);
}

drawChart();
