let dataSet;
let columns;
let columnsWithNegative = new Set();

let cell;
let [xAxis, xAxisGenerator, xAxisLabel, yAxis, yAxisGenerator, yAxisLabel] = [];

let xAxes = [[], []];
let yAxes = [[], []];
let xAxesLabels = [[], []];
let yAxesLabels = [[], []];
let dots = [[], []];

let [slider, sliderGenerator, sliderInput] = [];

let scales = { xScales: {}, yScales: {}, colorScales: {}, areaScales: {} };

let cellHandlers;
let brush;

let dimensions = {
  width: 1540,
  handler: 250,
  padding: 15
};

dimensions.size =
  (dimensions.width -
    2 * dimensions.handler -
    3 * dimensions.padding -
    dimensions.handler) /
    2 +
  dimensions.padding;

// TODO
// 1. svg size adjustment for labels
// 2. add legends
// 3. Layout..
// 4. Drawing rectangles over svgs.
// 5. Color scale - columnsWithNegative - map the point zero to the middle

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

  const wrapper = d3
    .select("#wrapper")
    .append("div")
    .attr("width", dimensions.width)
    .attr("height", dimensions.width + 120);

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

  cellHandlers = cell.selectAll(".cellHandlers");

  // rect on svgs
  // svgs
  //   .append("rect")
  //   .attr("fill", "none")
  //   .attr("stroke", "#aaa")
  //   .attr("x", dimensions.padding / 2 + 0.5)
  //   .attr("y", dimensions.padding / 2 + 0.5)
  //   .attr("width", 360)
  //   .attr("height", 360);

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
    .data(columns.filter(c => !columnsWithNegative.has(c)))
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
      .fill("skyblue")
      .on("onchange", val => {
        sliderInput.attr("value", null);

        sliderInput
          .attr("text", (val * 100).toFixed(2))
          .property("value", (val * 100).toFixed(2));

        dots[i][j]
          .transition()
          .duration(1000)
          .attr("r", function() {
            return d3.select(this).attr("rOriginal") * val;
          });
      });

    sliderInput.on("change", function() {
      let inputValue = this.value;
      sliderGenerator.silentValue(inputValue / 100);

      dots[i][j]
        .transition()
        .duration(1000)
        .attr("r", function() {
          return (d3.select(this).attr("rOriginal") * inputValue) / 100;
        });
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

  // Scales
  // xScales
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
    scales.xScales[c] = xScale.range([
      dimensions.padding / 2 + 1,
      dimensions.size - dimensions.padding * 3
    ]);
  });

  // yScales
  Object.entries(scales.xScales).forEach(([column, scale]) => {
    scales.yScales[column] = scale
      .copy()
      .range([
        dimensions.size - 2 * dimensions.padding,
        2 * dimensions.padding
      ]);
  });

  // color scales
  columns.forEach(c => {
    let colorScale;
    if (columnsWithNegative.has(c)) {
      colorScale = d3
        .scaleSequential(d3.interpolateRdBu)
        .domain([
          d3.max(dataSet.map(row => row[c])),
          d3.min(dataSet.map(row => row[c]))
        ]);
    } else {
      colorScale = d3
        .scaleSequential(d3.interpolateBlues)
        .domain([d3.max(dataSet.map(row => row[c])), 0]);
    }

    scales.colorScales[c] = colorScale;
  });

  // area scales
  columns
    .filter(c => !columnsWithNegative.has(c))
    .forEach(c => {
      let areaScale;
      areaScale = d3
        .scaleLinear()
        .domain([0, d3.max(dataSet.map(row => row[c]))])
        .range([3, 50]);
      scales.areaScales[c] = areaScale;
    });

  // brush - should cover four svgs simultaneously

  // different type of interaction.
  // Four svgs in each divs on one svgs?

  `
// currently
<div id="wrapper">
    <div>
      <div id="cell0">
        <div id="cellHandler00"></div>
        <svg id="canvas00"></svg>
      </div>
      <div id="cell1">
        <div id="cellHandler01"></div>
        <svg id="canvas01"></svg>
      </div>
      <div id="cell2">
        <div id="cellHandler10"></div>
        <svg id="canvas10"></svg>
      </div>
      <div id="cell3">
        <div id="cellHandler11"></div>
        <svg id="canvas11"></svg>
      </div>

    </div>
</div>


// New?
<div id="wrapper">
    <div>
      <div id="cell0">
        <div id="cellHandler00"></div>
      </div>
      <div id="cell1">
        <div id="cellHandler01"></div>
      </div>
      <div id="cell2">
        <div id="cellHandler10"></div>
      </div>
      <div id="cell3">
        <div id="cellHandler11"></div>
      </div>
    </div>
    <svg id="svgCell">
      <svg id="canvas00"></svg>
      <svg id="canvas01"></svg>
      <svg id="canvas10"></svg>
      <svg id="canvas11"></svg>
    </svg>
</div>
`;
  function brush(cell, circle) {
    const brush = d3
      .brush()
      .extent([
        [dimensions.padding / 2, dimensions.padding / 2],
        [
          dimensions.size - dimensions.padding / 2,
          dimensions.size - dimensions.padding / 2
        ]
      ])
      .on("start", brushStarted)
      .on("brush", brushed)
      .on("end", brushEnded);

    let brushCell;

    cell.call(brush);

    function brushStarted() {
      console.log("brushStarted", brushCell === this);
      if (brushCell !== this) {
        d3.select(brushCell).call(brush.move, null);
        brushCell = this;
      }
    }

    function brushed([i, j]) {
      if (d3.event.selecti8on === null) return;
      const [[x0, y0], [x1, y1]] = d3.event.selection;
      circle.classed("hidden", d => {
        let xSelected = d3.select(`#xSelection${i}${j}`).property("value");
        let ySelected = d3.select(`#ySelection${i}${j}`).property("value");
        return (
          x0 > scales.xScales[xSelected](d[xSelected]) ||
          x1 < scales.xScales[xSelected](d[xSelected]) ||
          y0 > scales.yScales[ySelected](d[ySelected]) ||
          y1 < scales.yScales[ySelected](d[ySelected])
        );
      });
    }

    function brushEnded() {
      if (d3.event.selection !== null) return;
      circle.classed("hidden", false);
    }
  }

  // dots
  cell.each(function([i, j]) {
    dots[i][j] = d3
      .select(`#canvas${i}${j}`)
      .selectAll("circle")
      .data(dataSet)
      .join("circle")
      .attr("cx", d => {
        let xSelected = d3.select(`#xSelection${i}${j}`).property("value");
        return scales.xScales[xSelected](d[xSelected]);
      })
      .attr("cy", d => {
        let ySelected = d3.select(`#ySelection${i}${j}`).property("value");
        return scales.yScales[ySelected](d[ySelected]);
      })
      .attr("r", d => {
        let areaSelected = d3
          .select(`#areaSelection${i}${j}`)
          .property("value");
        return scales.areaScales[areaSelected](d[areaSelected]);
      })
      .attr("rOriginal", d => {
        let areaSelected = d3
          .select(`#areaSelection${i}${j}`)
          .property("value");
        return scales.areaScales[areaSelected](d[areaSelected]);
      })
      .attr("fill", d => {
        let colorSelected = d3
          .select(`#colorSelection${i}${j}`)
          .property("value");
        return scales.colorScales[colorSelected](d[colorSelected]);
      })
      .attr("transform", `translate(15.5, -14.5)`)
      .attr("stroke", "black");

    d3.select(`#canvas${i}${j}`).call(brush, dots[i][j]);
  });
  // axes
  cell.each(function([i, j]) {
    console.log(`cell number: [${i}, ${j}]`);
    const xAxisGenerator = d3
      .axisBottom(
        scales.xScales[d3.select(`#xSelection${i}${j}`).property("value")]
      )
      .ticks(6);

    const xAxis = d3
      .select(`#canvas${i}${j}`)
      .append("g")
      .call(xAxisGenerator)
      .attr(
        "transform",
        `translate(15, ${dimensions.size - 3 * dimensions.padding})`
      );

    const xLabel = xAxis
      .append("text")
      .attr("x", dimensions.size / 2)
      .attr("y", dimensions.padding)
      .attr("fill", "black")
      .attr("font-size", "1.4em")
      .text(d3.select(`#xSelection${i}${j}`).property("value"));

    xAxes[i][j] = xAxis;
    xAxesLabels[i][j] = xLabel;

    const yAxisGenerator = d3
      .axisLeft(
        scales.yScales[d3.select(`#ySelection${i}${j}`).property("value")]
      )
      .ticks(6);

    const yAxis = d3
      .select(`#canvas${i}${j}`)
      .append("g")
      .call(yAxisGenerator)
      .attr("transform", `translate(23.5, -${dimensions.padding})`);

    const yLabel = yAxis
      .append("text")
      .attr("x", -dimensions.size / 2)
      .attr("y", -dimensions.padding)
      .attr("fill", "black")
      .text(d3.select(`#ySelection${i}${j}`).property("value"))
      .style("font-size", "1.4em")
      .style("transform", "rotate(-90deg)")
      .style("text-anchor", "middle");

    yAxes[i][j] = yAxis;
    yAxesLabels[i][j] = yLabel;
  });

  // connect update function to each selection in each cell
  cell.each(function([i, j]) {
    // let that = this;
    d3.select(`#ySelection${i}${j}`).on("change", function() {
      update("yScale", this.value, i, j);
    });

    d3.select(`#xSelection${i}${j}`).on("change", function() {
      update("xScale", this.value, i, j);
    });

    d3.select(`#colorSelection${i}${j}`).on("change", function() {
      update("colorScale", this.value, i, j);
    });

    d3.select(`#areaSelection${i}${j}`).on("change", function() {
      update("areaScale", this.value, i, j);
    });
  });
}

drawChart();

function update(scale, selectedOption, xIndex, yIndex) {
  console.log("scale: ", scale);
  console.log("selectedOption: ", selectedOption);
  console.log(`cell: [${xIndex}, ${yIndex}]`);

  let selectedScale = scales[`${scale}s`][selectedOption];

  if (columnsWithNegative.has(selectedOption)) {
    selectedScale.domain([
      d3.min(dataSet.map(row => row[selectedOption])),
      d3.max(dataSet.map(row => row[selectedOption]))
    ]);
  } else {
    selectedScale.domain([0, d3.max(dataSet.map(row => row[selectedOption]))]);
  }

  if (scale == "xScale") {
    selectedScale.range([
      dimensions.padding / 2 + 1,
      dimensions.size - dimensions.padding * 3
    ]);

    let xAxisGenerator = d3.axisBottom(selectedScale);

    xAxes[xIndex][yIndex]
      .transition()
      .duration(1000)
      .call(xAxisGenerator);

    xAxesLabels[xIndex][yIndex]
      .transition()
      .duration(1000)
      .text(selectedOption);

    dots[xIndex][yIndex]
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("cx", d => selectedScale(d[selectedOption]));
  } else if (scale == "yScale") {
    let yAxisGenerator = d3.axisLeft(selectedScale);

    yAxes[xIndex][yIndex]
      .transition()
      .duration(1000)
      .call(yAxisGenerator);

    yAxesLabels[xIndex][yIndex]
      .transition()
      .duration(1000)
      .text(selectedOption);

    dots[xIndex][yIndex]
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("cy", d => selectedScale(d[selectedOption]));
  } else if (scale == "areaScale") {
    selectedScale.range([0, 50]);

    dots[xIndex][yIndex]
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("r", d => selectedScale(d[selectedOption]))
      .attr("r", d => selectedScale(d[selectedOption]));
  } else if (scale == "colorScale") {
    dots[xIndex][yIndex]
      .data(dataSet)
      .transition()
      .style("fill", d => selectedScale(d[selectedOption]))
      .duration(1000);
  }
}
