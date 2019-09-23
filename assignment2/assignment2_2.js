let dataSet;
let columns;
let columnsWithNegative = new Set();

let [wrapper, bounds] = [];
let [xScale, yScale, colorScale, areaScale] = [];
let scales = {
  xScale: null,
  yScale: null,
  colorScale: null,
  areaScale: null
};

let [
  xAxis,
  xAxisGenerator,
  xAxisLabel,
  yAxis,
  yAxisGenerator,
  yAxisLabel,
  areaLegend,
  colorLegend
] = [];

let dots;
let [slider, sliderGenerator, sliderInput] = [];
let colorScheme;

let dimensions = {
  width: 800,
  height: 700,
  margin: {
    top: 50,
    right: 55,
    bottom: 50,
    left: 150
  }
};

let continentColorScale;

let legend;
let legendCircles;
let legendCircleTitle;
let legendCircleLines;
let legendCircleX;
let legendCircleY;
let legendColor;
let legendColorTitle;
let legendColorBars;

async function drawFunction() {
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dataSet = await d3
    .csv("./factbook.csv")
    .then(data =>
      data.map(row => {
        let entries = Object.entries(row);
        let obj = {};

        Object.entries(row).forEach(([key, value]) => {
          obj[key.trim()] = value.trim();
        });

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
            return row;
          }
        }
      });
    });

  console.log(dataSet);

  wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const cellHandler = d3
    .select("#wrapper")
    .append("div")
    .style("position", "absolute")
    .style("float", "left")
    .style("top", `${dimensions.margin.top}px`)
    .style("left", `${dimensions.width + dimensions.margin.right * 2}px`);

  const yLabel = cellHandler.append("label").text("yAxis");

  const ySelection = cellHandler
    .append("select")
    .attr("id", "ySelection")
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => !(c == "Country" || c == "Continent")))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const xLabel = cellHandler.append("label").text("xAxis");

  const xSelection = cellHandler
    .append("select")
    .attr("id", "xSelection")
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => !(c == "Country" || c == "Continent")))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const areaLabel = cellHandler.append("label").text("Area");

  const areaSelection = cellHandler
    .append("select")
    .attr("id", "areaSelection")
    .selectAll("option")
    .append("option")
    .data(
      columns.filter(
        c => !(columnsWithNegative.has(c) || c == "Country" || c == "Continent")
      )
    )
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const colorLabel = cellHandler.append("label").text("Color");

  const colorSelection = cellHandler
    .append("select")
    .attr("id", "colorSelection")
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => c != "Country"))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  cellHandler.selectAll("label, select").style("display", "block");

  scales.xScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataSet.map(row => row["GDP per capita"]))])
    .range([0, dimensions.boundedWidth]);

  scales.yScale = d3
    .scaleLinear()
    .domain([0, 90])
    .range([dimensions.boundedHeight, 0]);

  // setting default options
  d3.select("#ySelection")
    .selectAll("option")
    .property("selected", d => d == "Life expectancy at birth");

  d3.select("#xSelection")
    .selectAll("option")
    .property("selected", d => d == "GDP per capita");

  d3.select("#colorSelection")
    .selectAll("option")
    .property("selected", d => d == "Birth rate");

  d3.select("#areaSelection")
    .selectAll("option")
    .property("selected", d => d == "Population");

  scales.areaScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(
        dataSet.map(row => row[d3.select("#areaSelection").property("value")])
      )
    ])
    .range([3, 50]);

  scales.colorScale = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([
      d3.min(
        dataSet.map(row => row[d3.select("#colorSelection").property("value")])
      ),
      d3.max(
        dataSet.map(row => row[d3.select("#colorSelection").property("value")])
      )
    ]);

  continentColorScale = d3
    .scaleOrdinal(d3.schemeSet1)
    .domain(Object.keys(continentCountry));

  dots = bounds
    .selectAll("circle")
    .data(dataSet)
    .join("circle")
    .attr("cx", d => {
      let xSelected = d3.select("#xSelection").property("value");
      return scales.xScale(d[xSelected]);
    })
    .attr("cy", d => {
      let ySelected = d3.select("#ySelection").property("value");
      return scales.yScale(d[ySelected]);
    })
    .attr("r", d => {
      let areaSelected = d3.select("#areaSelection").property("value");
      return scales.areaScale(d[areaSelected]);
    })
    .attr("rOriginal", d => {
      let areaSelected = d3.select("#areaSelection").property("value");
      return scales.areaScale(d[areaSelected]);
    })
    .style("fill", d => {
      let colorSelected = d3.select("#colorSelection").property("value");
      if (isNaN(d[colorSelected])) {
        return "black";
      } else {
        return scales.colorScale(d[colorSelected]);
      }
      return scales.colorScale(d[colorSelected]);
    })
    // .style("opacity", "0.7")
    .attr("stroke", "black");

  xAxisGenerator = d3.axisBottom(scales.xScale);

  xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  xAxisLabel = xAxis
    .append("text")
    .attr("x", (dimensions.boundedWidth * 6) / 7)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .attr("font-size", "1.4em")
    .text(d3.select("#xSelection").property("value"));

  yAxisGenerator = d3.axisLeft(scales.yScale);

  yAxis = bounds.append("g").call(yAxisGenerator);

  yAxisLabel = yAxis
    .append("text")
    .attr("x", 20)
    .attr("y", -20)
    .attr("fill", "black")
    .text(d3.select("#ySelection").property("value"))
    .style("font-size", "1.4em")
    .style("text-anchor", "start");
  sliderDiv = cellHandler.append("div").attr("id", "slider");

  legend = cellHandler
    .append("g")
    .append("svg")
    .attr("width", 300)
    .attr("height", 550);

  legendCircleTitle = legend
    .append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("dy", "0.35em")
    .text(d3.select("#areaSelection").property("value"));

  let valuesToShow = (() => {
    let selected = d3.select("#areaSelection").property("value");
    let selectedData = dataSet.map(row => row[selected]);
    let format = d3.format(".2f");
    return [
      format(d3.min(selectedData)),
      format(d3.mean(selectedData)),
      format(d3.max(selectedData))
    ];
  })();
  legendCircleX = 120;
  legendCircleY = 250;

  legendCircles = legend
    .selectAll("circle")
    .data(valuesToShow)
    .join("circle")
    .attr("cx", legendCircleX)
    .attr("cy", d => legendCircleY - scales.areaScale(d))
    .attr("cyOriginal", d => legendCircleY - scales.areaScale(d))
    .attr("r", d => scales.areaScale(d))
    .attr("rOriginal", d => scales.areaScale(d))
    .style("fill", "none")
    .attr("stroke", "black");

  legendCircleLines = legend
    .append("g")
    .selectAll("line")
    .data(valuesToShow)
    .join("line")
    .attr("x1", legendCircleX)
    .attr("x2", 150)
    .attr("y1", d => legendCircleY - 2 * scales.areaScale(d))
    .attr("y2", (d, i) => {
      if (i % 2 == 1) {
        return legendCircleY - 2 * scales.areaScale(d) - 10;
      } else return legendCircleY - 2 * scales.areaScale(d);
    })
    .attr("stroke", "black")
    .style("stroke-dasharray", "2,2");

  legendCircleLabels = legend
    .append("g")
    .selectAll("text")
    .data(valuesToShow)
    .join("text")
    .attr("x", d => 160)
    .attr("y", (d, i) => {
      if (i % 2 == 1) {
        return legendCircleY - 2 * scales.areaScale(d) - 10;
      } else return legendCircleY - 2 * scales.areaScale(d);
    })
    .text(d => d)
    .style("font-size", 10)
    .style("display", "block")
    .attr("alignment-baseline", "middle");

  legendColorBarScale = d3
    .legendColor()
    .shapeWidth(45)
    .cells(9)
    .orient("vertical")
    .scale(scales.colorScale);

  let legendColorY = 300;
  legendColorTitle = legend
    .append("text")
    .attr("x", 0)
    .attr("y", legendColorY)
    .attr("dy", "0.35em")
    .text(d3.select("#colorSelection").property("value"));

  legendColorBars = legend
    .append("g")
    .attr("transform", `translate(0, ${legendColorY + 20})`);

  legendColorBars.call(legendColorBarScale);

  legendColorBars
    .append("rect")
    .attr("x", 0)
    .attr("y", 180)
    .attr("width", 45)
    .attr("height", 15)
    .attr("fill", "black");

  legendColorBars
    .append("text")
    .attr("x", 55)
    .attr("y", 180)
    .text("N/A")
    .attr("text-anchor", "start")
    .attr("alignment-baseline", "hanging");
  // slider
  sliderDiv.append("label").text("Area Slider");

  sliderInput = sliderDiv
    .append("input")
    .attr("id", "value-simple")
    .attr("type", "number")
    .style("display", "inline")
    .attr("value", 100)
    .attr("min", 0)
    .attr("max", 300)
    .on("change", function() {
      console.log("onchange");
      let inputValue = this.value;
      console.log("value: ", inputValue);
      sliderGenerator.silentValue(inputValue / 100);

      dots
        .transition()
        .duration(1000)
        .attr("r", function() {
          return (d3.select(this).attr("rOriginal") * inputValue) / 100;
        });

      legendCircles
        .transition()
        .duration(1000)
        .attr(
          "cy",
          d => legendCircleY - (scales.areaScale(d) * inputValue) / 100
        )
        .attr("r", d => (scales.areaScale(d) * inputValue) / 100);

      legendCircleLines
        .transition()
        .duration(1000)
        .attr(
          "y1",
          d => legendCircleY - (2 * scales.areaScale(d) * inputValue) / 100
        )
        .attr("y2", (d, i) => {
          if (i % 2 == 1) {
            return (
              legendCircleY - 10 - (2 * scales.areaScale(d) * inputValue) / 100
            );
          } else
            return (
              legendCircleY - 1 - (2 * scales.areaScale(d) * inputValue) / 100
            );
        });

      legendCircleLabels
        .transition()
        .duration(1000)
        .attr("y", (d, i) => {
          if (i % 2 == 1) {
            return (
              legendCircleY - 10 - (2 * scales.areaScale(d) * inputValue) / 100
            );
          } else
            return (
              legendCircleY - 1 - (2 * scales.areaScale(d) * inputValue) / 100
            );
        });
    });

  sliderDiv.append("label").text("%");

  sliderGenerator = d3
    .sliderBottom()
    .min(0)
    .max(3)
    .width(260)
    .tickFormat(d3.format(".2%"))
    .ticks(5)
    .default(1)
    .handle(
      d3
        .symbol()
        .type(d3.symbolCircle)
        .size(300)
    )
    .fill("skyblue")
    .on("onchange", function(val) {
      console.log("slider value: ", val);
      sliderInput.attr("value", null);

      sliderInput
        .attr("text", (val * 100).toFixed(2))
        .property("value", (val * 100).toFixed(2));

      dots
        .transition()
        .duration(1000)
        .attr("r", function() {
          return d3.select(this).attr("rOriginal") * val;
        });

      legendCircles
        .transition()
        .duration(1000)
        .attr("cy", d => legendCircleY - scales.areaScale(d) * val)
        .attr("r", d => scales.areaScale(d) * val);

      legendCircleLines
        .transition()
        .duration(1000)
        .attr("y1", d => legendCircleY - 2 * scales.areaScale(d) * val)
        .attr("y2", (d, i) => {
          if (i % 2 == 1) {
            return legendCircleY - 10 - 2 * scales.areaScale(d) * val;
          } else return legendCircleY - 1 - 2 * scales.areaScale(d) * val;
        });

      legendCircleLabels
        .transition()
        .duration(1000)
        .attr("y", (d, i) => {
          if (i % 2 == 1) {
            return legendCircleY - 10 - 2 * scales.areaScale(d) * val;
          } else return legendCircleY - 1 - 2 * scales.areaScale(d) * val;
        });
    });

  slider = sliderDiv
    .append("svg")
    .attr("width", 700)
    .attr("height", 100)
    .style("display", "block")
    .append("g")
    .attr("transform", "translate(0, 30)")
    .call(sliderGenerator);

  d3.select("#ySelection").on("change", function() {
    updateScale("yScale", this.value);
  });

  d3.select("#xSelection").on("change", function() {
    updateScale("xScale", this.value);
  });

  d3.select("#colorSelection").on("change", function() {
    updateScale("colorScale", this.value);
  });

  d3.select("#areaSelection").on("change", function() {
    updateScale("areaScale", this.value);
  });
}

function updateScale(scale, selectedOption) {
  console.log("scale: ", scale);
  console.log("selectedOption: ", selectedOption);

  let selectedScale = scales[scale];
  if (columnsWithNegative.has(selectedOption)) {
    console.log("columnsWithNegative has ", selectedOption);
    selectedScale.domain([
      d3.min(dataSet.map(row => row[selectedOption])),
      d3.max(dataSet.map(row => row[selectedOption]))
    ]);
  } else {
    selectedScale.domain([0, d3.max(dataSet.map(row => row[selectedOption]))]);
  }

  if (scale == "xScale") {
    selectedScale.range([0, dimensions.boundedWidth]);
    let longNumbers = [
      "Current account balance",
      "Electricity consumption",
      "Electricity production",
      "Exports",
      "GDP",
      "Natural gas consumption",
      "Population",
      "Reserves of foreign exchange & gold"
    ];
    xAxisGenerator = d3.axisBottom(selectedScale);

    if (longNumbers.includes(selectedOption)) {
      xAxisGenerator.ticks(5);
    }

    dots
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("cx", d => selectedScale(d[selectedOption]));

    xAxis
      .transition()
      .duration(1000)
      .call(xAxisGenerator);

    xAxisLabel
      .transition()
      .duration(1000)
      .text(selectedOption);
  } else if (scale == "yScale") {
    selectedScale.range([dimensions.boundedHeight, 0]);

    yAxisGenerator = d3.axisLeft(selectedScale);

    yAxis
      .transition()
      .duration(1000)
      .call(yAxisGenerator);

    yAxisLabel
      .transition()
      .duration(1000)
      .text(selectedOption);

    dots
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("cy", d => selectedScale(d[selectedOption]));
  } else if (scale == "areaScale") {
    sliderInput.attr("value", null);

    sliderInput.attr("text", 100).property("value", 100);
    selectedScale.range([3, 50]);
    sliderGenerator.silentValue(1);
    dots
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("r", d => selectedScale(d[selectedOption]))
      .attr("rOriginal", d => selectedScale(d[selectedOption]));

    legendCircleTitle
      .transition()
      .duration(1000)
      .text(selectedOption);

    let selectedData = dataSet.map(row => row[selectedOption]);
    let newLegendValues = [
      d3.format(".2f")(d3.min(selectedData)),
      d3.format(".2f")(d3.mean(selectedData)),
      d3.format(".2f")(d3.max(selectedData))
    ];

    console.log(newLegendValues);

    legendCircles
      .data(newLegendValues)
      .transition()
      .duration(1000)
      .attr("cx", legendCircleX)
      .attr("cy", d => legendCircleY - scales.areaScale(d))
      .attr("r", d => scales.areaScale(d))
      .style("fill", "none")
      .style("stroke", "black");

    legendCircleLines
      .data(newLegendValues)
      .transition()
      .duration(1000)
      .attr("x1", legendCircleX)
      .attr("x2", 150)
      .attr("y1", d => legendCircleY - 2 * selectedScale(d))
      .attr("y2", (d, i) => {
        if (i % 2 == 1) {
          return legendCircleY - 2 * selectedScale(d) - 10;
        } else return legendCircleY - 2 * selectedScale(d);
      });

    legendCircleLabels
      .data(newLegendValues)
      .transition()
      .duration(1000)
      .attr("y", (d, i) => {
        if (i % 2 == 1) {
          return legendCircleY - 2 * selectedScale(d) - 10;
        } else return legendCircleY - 2 * selectedScale(d);
      })
      .text(d => d);
  } else if (scale == "colorScale") {
    if (higherTheMoreBetterOrDeveloped.includes(selectedOption)) {
      selectedScale = d3
        .scaleSequential(d3.interpolateBlues)
        .domain([
          d3.min(dataSet.map(row => row[selectedOption])),
          d3.max(dataSet.map(row => row[selectedOption]))
        ]);
    } else {
      selectedScale = d3
        .scaleSequential(d3.interpolateReds)
        .domain([
          d3.min(dataSet.map(row => row[selectedOption])),
          d3.max(dataSet.map(row => row[selectedOption]))
        ]);
    }

    if (selectedOption == "Continent") {
      selectedScale = continentColorScale;
    }
    dots
      .data(dataSet)
      .transition()
      .style("fill", d => selectedScale(d[selectedOption]))
      .duration(1000);

    legendColorTitle
      .transition()
      .duration(1000)
      .text(selectedOption);

    legendColorBars.call(legendColorBarScale.scale(selectedScale));
  }
}

drawFunction();
