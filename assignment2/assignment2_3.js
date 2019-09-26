let dataSet;
let columns;
let columnsWithNegative = new Set();

let cell;

let xAxes = [[], []];
let yAxes = [[], []];
let xAxesLabels = [[], []];
let yAxesLabels = [[], []];
let xAxisGenerators = [[], []];
let yAxisGenerators = [[], []];
let dots = [[], []];

let sliders = [[], []];
let sliderGenerators = [[], []];
let sliderInputs = [[], []];

let formatters = {};
let scales = { xScales: {}, yScales: {}, colorScales: {}, areaScales: {} };

let legends = [[], []];
let legendValuesToShow = [[], []];

let legendCircles = [[], []];
let legendCircleTitles = [[], []];
let legendCircleLines = [[], []];
let legendCircleLabels = [[], []];
let legendCircleY;
let legendColorY;
let legendColors = [[], []];
let legendColorTitles = [[], []];
let legendColorBars = [[], []];
let legendColorBarScales = [[], []];
let cellHandlers;
let circle;
let dimensions = {
  width: 1560,
  handler: 220,
  padding: 90
};

dimensions.size =
  (dimensions.width -
    2 * dimensions.handler -
    2 * dimensions.padding -
    dimensions.handler) /
    2 +
  dimensions.padding;

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
      columns
        .filter(c => c != "Country")
        .forEach(c => {
          console.log(data[0][c]);

          if (data[0][c].startsWith("$")) {
            formatters[c] = d3.format("$,.2f");
          } else if (+data[0][c].split(",").join("") % 1 == 0) {
            formatters[c] = d3.format(",.2r");
          } else {
            formatters[c] = d3.format(",.2f");
          }
        });
      formatters["Country"] = d3.format("c");
      formatters["Continent"] = d3.format("c");

      return data.map(row => {
        columns
          .filter(column => column != "Country")
          .forEach(key => {
            if (row[key].startsWith("$")) {
              if (key == "Current account balance") {
                row[key] = row[key].replace(/[()]/g, "");
              }
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
    })
    .then(data => {
      columns.push("Continent");
      columns.sort();
      return data.map(row => {
        for ([continent, countryArr] of Object.entries(continentCountry)) {
          if (countryArr.includes(row.Country)) {
            row.Continent = continent;
            console.log("row: ", row);
            return row;
          }
        }
      });
    });

  console.log(dataSet);
  const wrapper = d3
    .select("#wrapper")
    .attr("width", dimensions.width)
    .attr("height", dimensions.width + 120);

  const svg = wrapper
    .append("svg")
    .attr("width", dimensions.size * 3 + dimensions.padding)
    .attr("height", dimensions.size * 2 + dimensions.padding)
    .attr(
      "transform",
      `translate(${dimensions.handler + dimensions.padding}, 0)`
    );

  svg
    .append("style")
    .text(`circle.hidden { fill: #000; fill-opacity: 1; r: 1px; }`);

  const cell = svg
    .append("g")
    .selectAll("g")
    .data(d3.cross([0, 1], [0, 1]))
    .join("g")
    .attr("id", ([i, j]) => `canvas${i}${j}`)
    .attr(
      "transform",
      ([i, j]) =>
        `translate(${dimensions.size * i +
          dimensions.padding}, ${dimensions.size * j})`
    );

  cell
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("x", dimensions.padding / 2 + 0.5)
    .attr("y", dimensions.padding / 2 + 0.5)
    .attr("width", dimensions.size - dimensions.padding)
    .attr("height", dimensions.size - dimensions.padding);

  const cellHandlers = wrapper
    .append("div")
    .selectAll("div")
    .data(d3.cross([0, 1], [0, 1]))
    .join("div")
    .style("position", "absolute")
    .each(function([i, j]) {
      d3.select(this)
        .style("top", () => {
          if (i == 0) return "10px";
          else if (i == 1) return `${dimensions.size + 30}px`;
        })
        .style("left", () => {
          if (j == 0) return `${dimensions.padding}px`;
          else if (j == 1)
            return `${dimensions.padding * 2 +
              dimensions.handler +
              2 * dimensions.size}px`;
        })
        .style("width", "260px")
        .style("float", "left");

      d3.select(this)
        .append("div")
        .attr("class", "cellHandlers")
        .attr("id", `cellHandler${i}${j}`)
        .style("float", () => {
          if (j == 0) return "left";
          else if (j == 1) return "right";
        })
        .style("padding-left", "10px")
        .style("padding-top", "10px")
        .style("width", "250px");
    })
    .selectAll(".cellHandlers");

  const selections = cellHandlers.append("div");

  const ySelectionLabels = selections.append("label").text("yAxis");

  const ySelections = selections
    .append("select")
    .attr("class", "ySelections")
    .attr("id", ([i, j]) => `ySelection${i}${j}`)
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => c != "Country" && c != "Continent"))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const xSelectionLabels = selections.append("label").text("xAxis");

  const xSelections = selections
    .append("select")
    .attr("class", "xSelections")
    .attr("id", ([i, j]) => `xSelection${i}${j}`)
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => c != "Country" && c != "Continent"))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const areaLabels = selections.append("label").text("Area");

  const areaSelections = selections
    .append("select")
    .attr("class", "areaSelections")
    .attr("id", ([i, j]) => `areaSelection${i}${j}`)
    .selectAll("option")
    .append("option")
    .data(
      columns.filter(
        c =>
          !columnsWithNegative.has(c) && !(c == "Country" || c == "Continent")
      )
    )
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const colorLabels = selections.append("label").text("Color");

  const colorSelections = selections
    .append("select")
    .attr("class", "colorSelections")
    .attr("id", ([i, j]) => `colorSelection${i}${j}`)
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => c !== "Country"))
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
  cellHandlers.each(function([i, j]) {
    sliders[i][j] = d3
      .select(`#cellHandler${i}${j}`)
      .append("div")
      .attr("class", "slider")
      .attr("id", `slider${i}${j}`);

    sliders[i][j].append("label").text("Area Slider");

    sliderInputs[i][j] = sliders[i][j]
      .append("input")
      .attr("class", "value-simples")
      .attr("id", `value-simple${i}${j}`)
      .attr("value", 100)
      .style("width", "100px");

    sliders[i][j].append("label").text("%");

    sliderGenerators[i][j] = d3
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
        sliderInputs[i][j].attr("value", null);

        sliderInputs[i][j]
          .attr("text", (val * 100).toFixed(2))
          .property("value", (val * 100).toFixed(2));

        dots[i][j]
          .transition()
          .duration(1000)
          .attr("r", function() {
            return d3.select(this).attr("rOriginal") * val;
          });

        let areaSelected = d3
          .select(`#areaSelection${i}${j}`)
          .property("value");
        legendCircles[i][j]
          .transition()
          .duration(1000)
          .attr(
            "cy",
            d => legendCircleY - scales.areaScales[areaSelected](d) * val
          )
          .attr("r", d => scales.areaScales[areaSelected](d) * val);

        legendCircleLines[i][j]
          .transition()
          .duration(1000)
          .attr(
            "y1",
            d => legendCircleY - 2 * scales.areaScales[areaSelected](d) * val
          )
          .attr("y2", (d, i) => {
            if (i % 2 == 1) {
              return (
                legendCircleY -
                10 -
                2 * scales.areaScales[areaSelected](d) * val
              );
            } else
              return (
                legendCircleY - 1 - 2 * scales.areaScales[areaSelected](d) * val
              );
          });

        legendCircleLabels[i][j]
          .transition()
          .duration(1000)
          .attr("y", (d, i) => {
            if (i % 2 == 1) {
              return (
                legendCircleY -
                10 -
                2 * scales.areaScales[areaSelected](d) * val
              );
            } else
              return (
                legendCircleY - 1 - 2 * scales.areaScales[areaSelected](d) * val
              );
          });

        // to draw axes on the forefront
        xAxes[i][j].call(xAxisGenerators[i][j]);
        yAxes[i][j].call(yAxisGenerators[i][j]);
      });

    sliderInputs[i][j].on("change", function() {
      let inputValue = this.value;
      sliderGenerators[i][j].silentValue(inputValue / 100);

      dots[i][j]
        .transition()
        .duration(1000)
        .attr("r", function() {
          return (d3.select(this).attr("rOriginal") * inputValue) / 100;
        });

      let areaSelected = d3.select(`#areaSelection${i}${j}`).property("value");
      legendCircles[i][j]
        .transition()
        .duration(1000)
        .attr(
          "cy",
          d =>
            legendCircleY -
            (scales.areaScales[areaSelected](d) * inputValue) / 100
        )
        .attr(
          "r",
          d => (scales.areaScales[areaSelected](d) * inputValue) / 100
        );

      legendCircleLines[i][j]
        .transition()
        .duration(1000)
        .attr(
          "y1",
          d =>
            legendCircleY -
            (2 * scales.areaScales[areaSelected](d) * inputValue) / 100
        )
        .attr("y2", (d, i) => {
          if (i % 2 == 1) {
            return (
              legendCircleY -
              10 -
              (2 * scales.areaScales[areaSelected](d) * inputValue) / 100
            );
          } else
            return (
              legendCircleY -
              1 -
              (2 * scales.areaScales[areaSelected](d) * inputValue) / 100
            );
        });

      legendCircleLabels[i][j]
        .transition()
        .duration(1000)
        .attr("y", (d, i) => {
          if (i % 2 == 1) {
            return (
              legendCircleY -
              10 -
              (2 * scales.areaScales[areaSelected](d) * inputValue) / 100
            );
          } else
            return (
              legendCircleY -
              1 -
              (2 * scales.areaScales[areaSelected](d) * inputValue) / 100
            );
        });

      // to draw axes on the forefront
      xAxes[i][j].call(xAxisGenerators[i][j]);
      yAxes[i][j].call(yAxisGenerators[i][j]);
    });

    sliders[i][j]
      .append("svg")
      .attr("width", 250)
      .attr("height", 100)
      .style("display", "block")
      .append("g")
      .attr("transform", "translate(30, 30)")
      .call(sliderGenerators[i][j]);

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
        xScale = d3
          .scaleLinear()
          .domain([0, d3.max(dataSet.map(row => row[c]))]);
      }
      scales.xScales[c] = xScale.range([
        dimensions.padding / 2,
        dimensions.size - dimensions.padding / 2
      ]);
    });

    // yScales
    Object.entries(scales.xScales).forEach(([column, scale]) => {
      scales.yScales[column] = scale
        .copy()
        .range([
          dimensions.size - dimensions.padding / 2,
          dimensions.padding / 2
        ]);
    });

    // color scales
    columns.forEach(c => {
      let colorScale;
      if (higherTheMoreBetterOrDeveloped.includes(c)) {
        colorScale = d3
          .scaleSequential(d3.interpolateBlues)
          .domain([
            d3.min(dataSet.map(row => row[c])),
            d3.max(dataSet.map(row => row[c]))
          ]);
      } else {
        colorScale = d3
          .scaleSequential(d3.interpolateReds)
          .domain([
            d3.max(dataSet.map(row => row[c])),
            d3.min(dataSet.map(row => row[c]))
          ]);
      }

      scales.colorScales[c] = colorScale;
    });

    let continentColorScale = d3
      .scaleOrdinal(d3.schemeSet1)
      .domain(Object.keys(continentCountry));

    scales.colorScales["Continent"] = continentColorScale;
    console.log(scales.colorScales["Continent"]);
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
  });

  // dots
  cell.each(function([j, i]) {
    dots[i][j] = d3
      .select(this)
      .selectAll("circle")
      .data(
        dataSet.sort((a, b) => {
          let areaSelected = d3
            .select(`#areaSelection${i}${j}`)
            .property("value");
          return b[areaSelected] - a[areaSelected];
        })
      )
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
      .attr("stroke", "black");

    // axes
    const xAxisGenerator = d3
      .axisBottom(
        scales.xScales[d3.select(`#xSelection${i}${j}`).property("value")]
      )
      .ticks(3);

    const xAxis = d3
      .select(`#canvas${i}${j}`)
      .append("g")
      .call(xAxisGenerator)
      .attr(
        "transform",
        `translate(0, ${dimensions.size - dimensions.padding / 2})`
      );

    const xAxisLabel = xAxis
      .append("text")
      .attr("x", dimensions.size / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .attr("font-size", "1.4em")
      .text(d3.select(`#xSelection${i}${j}`).property("value"));

    xAxes[i][j] = xAxis;
    xAxisGenerators[i][j] = xAxisGenerator;
    xAxesLabels[i][j] = xAxisLabel;

    const yAxisGenerator = d3
      .axisLeft(
        scales.yScales[d3.select(`#ySelection${i}${j}`).property("value")]
      )
      .ticks(6);

    const yAxis = svg
      .append("g")
      .call(yAxisGenerator)
      .attr(
        "transform",
        `translate(${j * dimensions.size + (dimensions.padding * 3) / 2}, ${i *
          dimensions.size})`
      );

    const yAxisLabel = yAxis
      .append("text")
      .attr("x", 50)
      .attr("y", dimensions.padding - 60)
      .attr("fill", "black")
      .text(d3.select(`#ySelection${i}${j}`).property("value"))
      .style("font-size", "1.4em")
      .style("text-anchor", "middle");

    yAxes[i][j] = yAxis;
    yAxisGenerators[i][j] = yAxisGenerator;
    yAxesLabels[i][j] = yAxisLabel;
  });

  circle = cell.selectAll("circle");

  legend = cellHandlers
    .append("g")
    .append("svg")
    .attr("width", 400)
    .attr("height", 200)
    .attr("transform", ([i, j]) => {
      if (j == 0) return `translate(-100, 0)`;
      else return `translate(-50, 0)`;
    });

  legend.each(function([i, j]) {
    let selected = d3.select(`#areaSelection${i}${j}`).property("value");
    let selectedData = dataSet.map(row => row[selected]);
    let format = d3.format(".2f");
    legendValuesToShow[i][j] = [
      format(d3.min(selectedData)),
      format(d3.mean(selectedData)),
      format(d3.max(selectedData))
    ];
  });

  legend.each(function([i, j]) {
    let areaSelected = d3.select(`#areaSelection${i}${j}`).property("value");
    let colorSelected = d3.select(`#colorSelection${i}${j}`).property("value");

    legendCircleY = 160;
    legendColorY = 10;
    legendCircleLeftX = 150;
    legendColorLeftX = 230;
    legendColorRightX = 50;
    legendCircleRightX = 250;

    legendCircleTitles[i][j] = d3
      .select(this)
      .append("text")
      .attr("x", () => {
        if (j == 0) return legendCircleLeftX;
        else if (j == 1) return legendCircleRightX;
      })
      .attr("y", 30)
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .text(areaSelected);

    legendCircles[i][j] = d3
      .select(this)
      .selectAll("circle")
      .data(legendValuesToShow[i][j])
      .join("circle")
      .attr("cx", () => {
        if (j == 0) return legendCircleLeftX;
        else if (j == 1) return legendCircleRightX;
      })
      .attr("cy", d => legendCircleY - scales.areaScales[areaSelected](d))
      .attr("cyOriginal", d => {
        return legendCircleY - scales.areaScales[areaSelected](d);
      })
      .attr("r", d => scales.areaScales[areaSelected](d))
      .attr("rOriginal", d => scales.areaScales[areaSelected](d))
      .attr("fill", "none")
      .attr("stroke", "black");

    legendCircleLines[i][j] = d3
      .select(this)
      .append("g")
      .selectAll("line")
      .data(legendValuesToShow[i][j])
      .join("line")
      .attr("x1", () => {
        if (j == 0) return legendCircleLeftX;
        else if (j == 1) return legendCircleRightX;
      })
      .attr("x2", () => {
        if (j == 0) return legendCircleLeftX - 50;
        else if (j == 1) return legendCircleRightX + 50;
      })
      .attr("y1", d => legendCircleY - 2 * scales.areaScales[areaSelected](d))
      .attr("y2", (d, idx) => {
        if (idx % 2 == 1) {
          return legendCircleY - 2 * scales.areaScales[areaSelected](d) - 15;
        } else return legendCircleY - 2 * scales.areaScales[areaSelected](d);
      })
      .attr("stroke", "black")
      .style("stroke-dasharray", "2,2");

    legendCircleLabels[i][j] = d3
      .select(this)
      .append("g")
      .selectAll("text")
      .data(legendValuesToShow[i][j])
      .join("text")
      .attr("x", () => {
        if (j == 0) return legendCircleLeftX - 60;
        else if (j == 1) return legendCircleRightX + 60;
      })
      .attr("y", (d, idx) => {
        if (idx % 2 == 1) {
          return legendCircleY - 2 * scales.areaScales[areaSelected](d) - 15;
        } else return legendCircleY - 2 * scales.areaScales[areaSelected](d);
      })
      .text(d => formatters[areaSelected](d))
      .style("font-size", 10)
      .style("display", "block")
      .attr("aligning-baseline", "middle")
      .style("text-anchor", () => {
        if (j == 0) return "end";
        else if (j == 1) return "start";
      });

    legendColorBarScales[i][j] = d3
      .legendColor()
      .shapeWidth(20)
      .cells(7)
      .orient("vertical")
      .scale(scales.colorScales[colorSelected])
      .labelFormat(formatters[colorSelected]);

    legendColorTitles[i][j] = d3
      .select(this)
      .append("text")
      .attr("x", () => {
        if (j == 0) return legendColorLeftX;
        else if (j == 1) return legendColorRightX;
      })
      .attr("y", legendColorY)
      .attr("dy", "0.35em")
      .style("text-anchor", "start")
      .text(colorSelected);

    legendColorBars[i][j] = d3
      .select(this)
      .append("g")
      .attr("transform", () => {
        if (j == 0)
          return `translate(${legendColorLeftX}, ${legendColorY + 20})`;
        else if (j == 1)
          return `translate(${legendColorRightX}, ${legendColorY + 20})`;
      });

    legendColorBars[i][j].call(legendColorBarScales[i][j]);
  });

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

    function brushed([j, i]) {
      console.log("brushed");
      if (d3.event.selection === null) return;
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
      console.log("brushEnded");
      if (d3.event.selection !== null) return;
      circle.classed("hidden", false);
    }
  }

  cell.call(brush, circle);

  // connect update function to each selection in each cell
  cell.each(function([j, i]) {
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
  } else if (selectedOption != "Continent") {
    selectedScale.domain([0, d3.max(dataSet.map(row => row[selectedOption]))]);
  }

  if (scale == "xScale") {
    selectedScale.range([
      dimensions.padding / 2,
      dimensions.size - dimensions.padding / 2
    ]);

    dots[xIndex][yIndex]
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("cx", d => selectedScale(d[selectedOption]));

    let longNumbers = [
      "Area",
      "Current account balance",
      "Electricity consumption",
      "Electricity production",
      "Imports",
      "Exports",
      "Highways",
      "GDP",
      "Natural gas consumption",
      "Population",
      "Reserves of foreign exchange & gold"
    ];

    let xAxisGenerator = d3.axisBottom(selectedScale);
    if (longNumbers.includes(selectedOption)) {
      xAxisGenerator.ticks(3);
    }

    xAxes[yIndex][xIndex]
      .transition()
      .duration(1000)
      .call(xAxisGenerator);

    xAxesLabels[yIndex][xIndex]
      .transition()
      .duration(1000)
      .text(selectedOption);
  } else if (scale == "yScale") {
    let yAxisGenerator = d3.axisLeft(selectedScale);
    dots[xIndex][yIndex]
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("cy", d => selectedScale(d[selectedOption]));

    yAxes[xIndex][yIndex]
      .transition()
      .duration(1000)
      .call(yAxisGenerator);

    yAxesLabels[xIndex][yIndex]
      .transition()
      .duration(1000)
      .text(selectedOption);
  } else if (scale == "areaScale") {
    selectedScale.range([2, 40]);
    sliderInputs[xIndex][yIndex].attr("value", null);
    sliderInputs[xIndex][yIndex].attr("text", 100).property("value", 100);
    sliderGenerators[xIndex][yIndex].silentValue(1);

    dots[xIndex][yIndex]
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("r", d => selectedScale(d[selectedOption]))
      .attr("r", d => selectedScale(d[selectedOption]));

    legendCircleTitles[xIndex][yIndex]
      .transition()
      .duration(1000)
      .text(selectedOption);

    let selectedData = dataSet.map(row => row[selectedOption]);
    let newLegendValues = [
      d3.format(".2f")(d3.min(selectedData)),
      d3.format(".2f")(d3.mean(selectedData)),
      d3.format(".2f")(d3.max(selectedData))
    ];

    legendCircles[xIndex][yIndex]
      .data(newLegendValues)
      .transition()
      .duration(1000)
      .attr("cy", d => legendCircleY - scales.areaScales[selectedOption](d))
      .attr("r", d => scales.areaScales[selectedOption](d))
      .style("fill", "none")
      .style("stroke", "black");

    legendCircleLines[xIndex][yIndex]
      .data(newLegendValues)
      .transition()
      .duration(1000)
      .attr("y1", d => legendCircleY - 2 * selectedScale(d))
      .attr("y2", (d, i) => {
        if (i == 0) {
          return legendCircleY - 2 * selectedScale(d);
        } else if (i == 1) {
          return legendCircleY - 2 * selectedScale(d) - 10;
        } else if (i == 2) {
          return legendCircleY - 2 * selectedScale(d) - 15;
        }
      });

    legendCircleLabels[xIndex][yIndex]
      .data(newLegendValues)
      .transition()
      .duration(1000)
      .attr("y", (d, i) => {
        if (i == 0) {
          return legendCircleY - 2 * selectedScale(d);
        } else if (i == 1) {
          return legendCircleY - 2 * selectedScale(d) - 10;
        } else if (i == 2) {
          return legendCircleY - 2 * selectedScale(d) - 15;
        }
      })
      .text(d => formatters[selectedOption](d));

    xAxes[xIndex][yIndex].call(xAxisGenerators[xIndex][yIndex]);
    yAxes[xIndex][yIndex].call(yAxisGenerators[xIndex][yIndex]);
  } else if (scale == "colorScale") {
    dots[xIndex][yIndex]
      .data(dataSet)
      .transition()
      .duration(1000)
      .style("fill", d => selectedScale(d[selectedOption]));

    legendColorTitles[xIndex][yIndex]
      .transition()
      .duration(1000)
      .text(selectedOption);

    if (selectedOption != "Continent") {
      legendColorBarScales[xIndex][yIndex] = null;
      legendColorBarScales[xIndex][yIndex] = d3
        .legendColor()
        .shapeWidth(20)
        .cells(7)
        .orient("vertical")
        .scale(selectedScale)
        .labelFormat(formatters[selectedOption]);
    } else {
      legendColorBarScales[xIndex][yIndex] = null;
      legendColorBarScales[xIndex][yIndex] = d3
        .legendColor()
        .shapeWidth(20)
        .cells(7)
        .orient("vertical")
        .scale(selectedScale);
    }

    legendColorBars[xIndex][yIndex].call(legendColorBarScales[xIndex][yIndex]);

    xAxes[xIndex][yIndex].call(xAxisGenerators[xIndex][yIndex]);
    yAxes[xIndex][yIndex].call(yAxisGenerators[xIndex][yIndex]);
  }
}

drawChart();
