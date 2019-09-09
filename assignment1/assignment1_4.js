let origins = ["US", "Europe", "Japan"];
let columns = ["MPG", "Weight", "Horsepower", "Displacement"];
let dataSet;

// FOR debugging
function log(selection, msg) {
  console.log(msg, selection);
}

async function drawChart() {
  // let dimensions = {
  dimensions = {
    // width: window.innerWidth * 0.9,
    width: 964,
    padding: 30
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
    .attr("transform", `translate(${dimensions.padding}, 0)`)
    .style("max-width", "100%")
    .style("height", "auto");

  const x = columns.map(c =>
    d3
      .scaleLinear()
      .domain(d3.extent(dataSet, d => d[c]))
      .rangeRound([
        dimensions.padding / 2,
        dimensions.size - dimensions.padding / 2
      ])
  );

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

  const y = x.map(x =>
    x
      .copy()
      .range([dimensions.size - dimensions.padding / 2, dimensions.padding / 2])
  );

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

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  const cell = svg
    .append("g")
    .selectAll("g")
    .data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
    .join("g")
    .attr(
      "transform",
      ([i, j]) => `translate(${i * dimensions.size}, ${j * dimensions.size})`
    );

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
