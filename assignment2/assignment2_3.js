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
    (dimensions.width - 3 * dimensions.padding) / 2 + dimensions.padding;

  const wrapper = d3
    .select("#wrapper")
    .append("div")
    .attr("width", dimensions.width)
    .attr("height", dimensions.width + 120);

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

  const cell = wrapper
    .append("div")
    .selectAll("div")
    .data(d3.cross([0, 1], [0, 1]))
    .join("div")
    .style("position", "absolute")
    .each(function([i, j]) {
      d3.select(this)
        .style("top", `${i * dimensions.size}px`)
        .style("left", `${j * dimensions.size}px`);

      if (j == 0) {
        d3.select(this)
          .append("div")
          .attr("class", "dropDownMenus")
          .style("float", "left");
        d3.select(this)
          .append("svg")
          .attr("class", "svgsInCell")
          .style("float", "left");
      } else if (j == 1) {
        d3.select(this)
          .append("svg")
          .attr("class", "svgsInCell")
          .style("float", "left");
        d3.select(this)
          .append("div")
          .attr("class", "dropDownMenus")
          .style("float", "right");
      }
    });

  const svgs = cell.selectAll(".svgsInCell");

  const cellDropDown = cell.selectAll(".dropDownMenus");

  svgs
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("x", dimensions.padding / 2 + 0.5)
    .attr("y", dimensions.padding / 2 + 0.5)
    .attr("width", dimensions.size - dimensions.padding)
    .attr("height", dimensions.size - dimensions.padding);

  const yLabels = cellDropDown.append("label").text("yAxis");

  const ySelections = cellDropDown
    .append("select")
    .attr("class", "ySelections")
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => c != "Country"))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const xLabels = cellDropDown.append("labe").text("xAxis");

  const xSelections = cellDropDown
    .append("select")
    .attr("class", "xSelections")
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => c != "Country"))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const areaLabels = cellDropDown.append("label").text("Area");

  const areaSelections = cellDropDown
    .append("select") // maybe should exclude columns with negative values
    .attr("class", "areaSelections")
    .selectAll("option")
    .append("option")
    .data(columns)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const colorLabels = cellDropDown.append("label").text("Color");

  const colorSelections = cellDropDown
    .append("select")
    .attr("class", "colorSelections")
    .selectAll("option")
    .append("option")
    .data(columns)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  cellDropDown.selectAll("label, select").style("display", "block");
}

drawChart();
