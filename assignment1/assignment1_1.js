let dataSet;
let bins = new Set();
let origins = ["US", "Europe", "Japan"];

// modified dataSet
/*
[{bin: __-__, counts: { US: __, Europe: __, Japan: __ }}]
*/

function findMPGBin(value) {
  let floorValue = Math.floor(value);
  let mpgBin =
    floorValue % 2 == 0
      ? `${floorValue}-${floorValue + 2}`
      : `${floorValue - 1}-${floorValue + 1}`;
  return mpgBin;
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

  dataSet = await d3.csv("./old_cars.csv").then(data =>
    data.map(row => {
      row.mpgBin = findMPGBin(row.MPG);
      bins.add(row.mpgBin);
      return row;
    })
  );

  let sortedBins = [...bins].sort(
    (a, b) => +a.split("-")[0] - +b.split("-")[0]
  );

  // newData:
  // [ {bin: 'n_n', counts: {US: 0, Europe: 0, Japan: 0}}]
  let newData = sortedBins.map(bin => {
    let obj = {};
    obj.bin = bin;
    obj.counts = { US: 0, Europe: 0, Japan: 0 };
    return obj;
  });

  dataSet.forEach(row => {
    newData.filter(el => el.bin === row.mpgBin)[0].counts[row.Origin] += 1;
  });

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
    .domain([0, d3.max(newData.map(row => d3.max(Object.values(row.counts))))])
    .range([dimensions.boundedHeight, 0]);

  const xMpgScale = d3
    .scaleBand()
    .domain(
      [...dataSet.map(r => r.mpgBin)].sort(
        (a, b) => +a.split("-")[0] - +b.split("-")[0]
      )
    )
    .range([0, dimensions.boundedWidth])
    .padding(0.2);

  const xOriginScale = d3
    .scaleBand()
    .domain(origins)
    .range([0, xMpgScale.bandwidth()]);

  const yAxisGenerator = d3.axisLeft(yScale);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  const xAxisGenerator = d3.axisBottom(xMpgScale);

  const color = d3
    .scaleOrdinal()
    .domain(origins)
    .range(["red", "green", "blue"]);

  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

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

  bounds
    .append("g")
    .selectAll("g")
    .data(newData)
    .join("g")
    .attr("transform", d => `translate(${xMpgScale(d.bin)}, 0)`)
    .selectAll("rect")
    .data(d => origins.map(origin => ({ origin, count: d.counts[origin] })))
    .join("rect")
    .attr("x", d => xOriginScale(d.origin))
    .attr("y", d => yScale(d.count))
    .attr("width", xOriginScale.bandwidth())
    .attr("height", d => yScale(0) - yScale(d.count))
    .attr("fill", d => color(d.origin));
}

drawChart();
