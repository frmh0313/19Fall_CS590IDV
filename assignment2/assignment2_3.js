let dataSet;
let columns;
let columnsWithNegative = new Set();

async function drawChart() {
  dataSet = await d3
    .csv("./factbook.csv")
    .then(data =>
      data.map(row => {
        let entries = Object.entries(row);
        let obj = {};

        for ([key, value] of entries) {
          obj[key.trim()] = value.trim();
        }
        return obj;
      })
    )
    .then(data => {
      columns = Object.keys(data[0]);

      return data.map(row => {
        columns
          .filter(column => column != "Country")
          .forEach(key => {
            if (row[key].startsWith("$")) {
              row[key] = +row[key]
                .substr(1)
                .split(",")
                .join("");
            } else if (row[key].includes(",")) {
              row[key] = +row[key].split(",").join("");
            } else {
              row[key] = +row[key];
            }

            if (row[key] < 0) {
              columnsWithNegative.add(key);
            }
          });
        return row;
      });
    });

  let dimensions = {
    width: 964,
    padding: 30
  };

  dimensions.size =
    (dimensions.width - (columns.length + 1) * dimensions.padding) /
      columns.length +
    dimensions.padding;

  const svg = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.width + 120)
    .attr(
      "viewBox",
      `${-dimensions.padding} 60 ${dimensions.width} ${dimensions.width}`
    )
    .attr("transform", `translate(${dimensions.padding}, 60)`)
    .style("max-width", "100%")
    .style("height", "auto");

  const xScales = {};
  columns.forEach(c => {
    let xScale;
    if (columnsWithNegative.has(c)) {
      xScale = d3
        .scaleLinear()
        .domain([
          d3.min(dataSet.map(row => row[c])),
          d3.max(dataSet.map(row => row[c]))
        ]);
    } else {
      xScale = d3.scaleLinear().domain([0, d3.max(dataSet.map(row => row[c]))]);
    }
    xScales[c] = xScale.range([
      dimensions.padding / 2,
      dimensions.size - dimensions.padding / 2
    ]);
  });

  const yScales = {};

  Object.entries(xScales).forEach(([column, scale]) => {
    yScales[column] = scale
      .copy()
      .range([
        dimensions.size - dimensions.padding / 2,
        dimensions.padding / 2
      ]);
  });

  const cell = svg
    .append("g")
    .selectAll("g")
    .data([1, 2, 3, 4])
    .join("g")
    .attr(
      "transform",
      ([i, j]) => `translate(${i * dimensions.size}, ${j * dimensions.size})`
    );

  cell
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("x", dimensions.padding / 2 + 0.5)
    .attr("y", dimensions.padding / 2 + 0.5)
    .attr("width", dimensions.size - dimensions.padding)
    .attr("height", dimensions.size - dimensions.padding);
}

drawChart();
