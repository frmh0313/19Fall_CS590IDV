let dataSet;
let columns;
let columnsWithNegative = new Set();

let cell;
let [xAxis, xAxisGenerator, xAxisLabel, yAxis, yAxisGenerator, yAxisLabel] = [];
let dots;

let [slider, sliderGenerator, sliderInput] = [];

let xScales = {};
let yScales = {};
let colorScales = {};
let areaScales = {};

let cellHandlers;
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
    width: 1600,
    handler: 250,
    padding: 30
  };

  dimensions.size =
    (dimensions.width -
      2 * dimensions.handler -
      3 * dimensions.padding -
      dimensions.handler) /
      2 +
    dimensions.padding;

  // console.log("dimensions.size: ", dimensions.size);

  const wrapper = d3
    .select("#wrapper")
    .append("div")
    .attr("width", dimensions.width)
    .attr("height", dimensions.width + 120);

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

  const xAxis = function(g) {
    const axis = d3
      .axisBottom()
      .ticks(6)
      .tickSize(dimensions.size * columns.length);

    // Continue from putting xaxes.
    return g
      .selectAll("g")
      .data(xScales)
      .join("g")
      .attr("transform", (d, i) => `translate`);
  };

  Object.entries(xScales).forEach(([column, scale]) => {
    yScales[column] = scale
      .copy()
      .range([
        dimensions.size - dimensions.padding / 2,
        dimensions.padding / 2
      ]);
  });

  // Drawing four cells
  cell = wrapper
    .append("div")
    .selectAll("div")
    .data(d3.cross([0, 1], [0, 1]))
    .join("div")
    .style("position", "absolute")
    .each(function([i, j]) {
      d3.select(this)
        .style("top", `${i * dimensions.size}px`)
        .style(
          "left",
          `${j * (dimensions.size + dimensions.padding + dimensions.handler)}px`
        )
        .style("width", "650px")
        .style("float", "left");

      if (j == 0) {
        d3.select(this)
          .append("div")
          .attr("class", "cellHandlers")
          .attr("id", `cellHandler${i}${j}`)
          .style("float", "left")
          .style("padding-left", "10px")
          .style("padding-top", "10px")
          .style("width", "250px");
        // .attr("width", 120);

        d3.select(this)
          .append("svg")
          .attr("class", "svgsInCell")
          .attr("id", `canvas${i}${j}`)
          .style("float", "left")
          .attr("width", dimensions.size - dimensions.padding)
          .attr("height", dimensions.size - dimensions.padding);
      } else if (j == 1) {
        d3.select(this)
          .append("svg")
          .attr("class", "svgsInCell")
          .attr("id", `canvas${i}${j}`)
          .style("float", "left")
          .attr("width", dimensions.size - dimensions.padding)
          .attr("height", dimensions.size - dimensions.padding);

        d3.select(this)
          .append("div")
          .attr("class", "cellHandlers")
          .attr("id", `cellHandler${i}${j}`)
          .style("float", "right")
          .style("width", "250px");
      }
    });

  const svgs = cell.selectAll(".svgsInCell");

  svgs.append("g").call(xAxis);

  svgs.append("g").call(yAxis);

  cellHandlers = cell.selectAll(".cellHandlers");

  svgs
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("x", dimensions.padding / 2 + 0.5)
    .attr("y", dimensions.padding / 2 + 0.5)
    .attr("width", 350)
    .attr("height", 350);

  const yLabels = cellHandlers.append("label").text("yAxis");

  const ySelections = cellHandlers
    .append("select")
    .attr("class", "ySelections")
    .attr("id", ([i, j]) => `ySelection${i}${j}`)
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => c != "Country"))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const xLabels = cellHandlers.append("labe").text("xAxis");

  const xSelections = cellHandlers
    .append("select")
    .attr("class", "xSelections")
    .attr("id", ([i, j]) => `xSelection${i}${j}`)
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => c != "Country"))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const areaLabels = cellHandlers.append("label").text("Area");

  const areaSelections = cellHandlers
    .append("select") // maybe should exclude columns with negative values
    .attr("class", "areaSelections")
    .attr("id", ([i, j]) => `areaSelection${i}${j}`)
    .selectAll("option")
    .append("option")
    .data(columns)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const colorLabels = cellHandlers.append("label").text("Color");

  const colorSelections = cellHandlers
    .append("select")
    .attr("class", "colorSelections")
    .attr("id", ([i, j]) => `colorSelection${i}${j}`)
    .selectAll("option")
    .append("option")
    .data(columns)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  cellHandlers.selectAll("label, select").style("display", "block");

  // setting default value
  d3.selectAll(".ySelections")
    .selectAll("option")
    .property("selected", d => d == "Life expectancy at birth");

  d3.selectAll(".xSelections")
    .selectAll("option")
    .property("selected", d => d == "GDP per capita");

  d3.selectAll(".colorSelections")
    .selectAll("option")
    .property("selected", d => d == "Birth rate");

  d3.selectAll(".areaSelections")
    .selectAll("option")
    .property("selected", d => d == "Population");

  // slider
  cell.each(function([i, j]) {
    let slider = d3
      .select(`#cellHandler${i}${j}`)
      .append("div")
      .attr("class", "slider")
      .attr("id", `slider${i}${j}`);

    slider.append("label").text("Area Slider");

    let sliderInput = slider
      .append("input")
      .attr("class", "value-simples")
      .attr("id", `value-simple${i}${j}`)
      .attr("value", 100)
      .style("width", "100px");

    slider.append("label").text("%");

    let sliderGenerator = d3
      .sliderBottom()
      .min(0)
      .max(3)
      .width(200)
      .tickFormat(d3.format(".2%"))
      .ticks(4)
      .default(1)
      .handle(
        d3
          .symbol()
          .type(d3.symbolCircle)
          .size(100)
      )
      .fill("skyblue");

    sliderInput.on("change", function() {
      let inputValue = this.value;
      sliderGenerator.silentValue(inputValue / 100);
    });

    sliderGenerator.on("onchange", val => {
      sliderInput.attr("value", null);

      sliderInput
        .attr("text", (val * 100).toFixed(2))
        .property("value", (val * 100).toFixed(2));
    });

    slider
      .append("svg")
      .attr("width", 250)
      .attr("height", 100)
      .style("display", "block")
      .append("g")
      .attr("transform", "translate(30, 30)")
      .call(sliderGenerator);
  });

  cell.each(function([i, j]) {
    d3.select(`#canvas${i}${j}`)
      .selectAll("circle")
      .data(dataSet)
      .join("circle")
      .attr("cx", d => {
        let selected = d3.select(`#xSelection${i}${j}`).property("value");
        return xScales[selected](d[selected]);
      })
      .attr("cy", d => {
        let selected = d3.select(`#ySelection${i}${j}`).property("value");
        return yScales[selected](d[selected]);
      })
      .attr("r", 3.5)
      .attr("fill", "skyblue");
  });

  cell.each(function([i, j]) {
    let that = this;
    d3.select(`#ySelection${i}${j}`).on("change", function() {
      update(that, this.value, i, j);
    });
  });
}

drawChart();

function update(cell, selectOption, xIndex, yIndex) {
  console.log("selected selection: ", `ySelection${xIndex}${yIndex}`);
  console.log("cell: ", cell);
  console.log("d3 select cell: ", d3.select(cell).select("svg"));

  let insertedDiv = d3
    .select(cell)
    .select("rect")
    .append("p")
    .text("added");
}
