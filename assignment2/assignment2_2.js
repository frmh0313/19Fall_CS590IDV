let birthRateBins = new Set();
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
    top: 15,
    right: 15,
    bottom: 40,
    left: 60
  }
};

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

  console.log(dataSet);

  // TODO
  // add legends and implement transitioning of them
  // margin considering the long numbers
  // translating xAxis considering the size of bubbles. - adding padding? zoom in as slider moves
  // synchronize the value of input element and slider

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

  scales.xScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataSet.map(row => row["GDP per capita"]))])
    .range([0, dimensions.boundedWidth]);

  xAxisGenerator = d3.axisBottom(scales.xScale);

  xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  console.log(d3.select("#xSelection").property("value"));
  scales.yScale = d3
    .scaleLinear()
    .domain([0, 90])
    .range([dimensions.boundedHeight, 0]);

  yAxisGenerator = d3.axisLeft(scales.yScale);

  yAxis = bounds.append("g").call(yAxisGenerator);

  sliderGenerator = d3
    .sliderBottom()
    .min(0)
    .max(3)
    .width(600)
    .tickFormat(d3.format(".2%"))
    .ticks(10)
    .default(1)
    .handle(
      d3
        .symbol()
        .type(d3.symbolCircle)
        .size(300)
    )
    .fill("skyblue")
    .on("onchange", function(val) {
      sliderInput.attr("value", null);

      sliderInput
        .attr("text", (val * 100).toFixed(2))
        .property("value", (val * 100).toFixed(2)); // property should be used instead of attr...

      dots
        .transition()
        .duration(1000)
        .attr("r", function() {
          return d3.select(this).attr("rOriginal") * val;
        });
    });

  sliderInput = d3
    .select("#value-simple")
    .attr("value", 100)
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
    });

  slider = d3
    .select("#slider")
    .append("svg")
    .attr("width", 700)
    .attr("height", 100)
    .style("display", "block")
    .append("g")
    .attr("transform", "translate(30, 30)")
    .call(sliderGenerator);

  d3.select("#dropDownMenus")
    .selectAll("select")
    .selectAll("option")
    .append("option")
    .data(columns.filter(c => c !== "Country"))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  d3.select("#colorSelection")
    .append("option")
    .join("option")
    .attr("value", "Country")
    .text("Country");
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

  xAxisLabel = xAxis
    .append("text")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .attr("font-size", "1.4em")
    .text(d3.select("#xSelection").property("value"));

  yAxisLabel = yAxis
    .append("text")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .attr("fill", "black")
    .text(d3.select("#ySelection").property("value"))
    .style("font-size", "1.4em")
    .style("transform", "rotate(-90deg)")
    .style("text-anchor", "middle");

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
    .scaleSequential(d3.interpolateGreens)
    // .scaleSequential(d3.interpolateGreens)
    .domain([
      0,
      d3.max(
        dataSet.map(row => row[d3.select("#colorSelection").property("value")])
      )
    ]);

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
      return scales.colorScale(d[colorSelected]);
    })
    // .style("opacity", "0.7")
    .attr("stroke", "black");

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

  // options should be considered
}

function updateScale(scale, selectedOption) {
  console.log("scale: ", scale);
  console.log("selectedOption: ", selectedOption);

  let selectedScale = scales[scale];
  if (columnsWithNegative.has(selectedOption)) {
    selectedScale.domain([
      d3.min(dataSet.map(row => row[selectedOption])),
      d3.max(dataSet.map(row => row[selectedOption]))
    ]);
  } else {
    selectedScale.domain([0, d3.max(dataSet.map(row => row[selectedOption]))]);
  }

  if (scale == "xScale") {
    selectedScale.range([0, dimensions.boundedWidth]);

    xAxisGenerator = d3.axisBottom(selectedScale);

    xAxis
      .transition()
      .duration(1000)
      .call(xAxisGenerator);

    dots
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("cx", d => selectedScale(d[selectedOption]));

    xAxisLabel
      .transition()
      .duration(1000)
      .text(selectedOption);
  } else if (scale == "yScale") {
    selectedScale.range([dimensions.boundedHeight, 0]); // sometimes it should cover negative values.

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
    // should exclude negative values
    selectedScale.range([0, 50]);

    dots
      .data(dataSet)
      .transition()
      .duration(1000)
      .attr("r", d => selectedScale(d[selectedOption]))
      .attr("rOriginal", d => selectedScale(d[selectedOption]));
  } else if (scale == "colorScale") {
    dots
      .data(dataSet)
      .transition()
      .style("fill", d => selectedScale(d[selectedOption]))
      .duration(1000);
  }
}

drawFunction();
