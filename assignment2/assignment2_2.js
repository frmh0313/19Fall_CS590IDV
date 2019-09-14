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
  // width: window.innerWidth * 0.9,
  width: 800,
  height: 700,
  margin: {
    top: 15,
    right: 15,
    bottom: 40,
    left: 60
  }
};
function findBirthRateBin(value) {
  return `${value / 10}0-${value / 10}9`;
}

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

        row["Birth rate bin"] = findBirthRateBin(row["Birth rate"]);
        birthRateBins.add(row["Birth rate bin"]);

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

  console.log(`xScale(GDP): ${scales.xScale(30000)}`);

  xAxisGenerator = d3.axisBottom(scales.xScale);

  xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  xAxisLabel = xAxis
    .append("text")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .attr("font-size", "1.4em")
    .text("GDP per capita");

  scales.yScale = d3
    .scaleLinear()
    .domain([0, 90])
    .range([dimensions.boundedHeight, 0]);

  yAxisGenerator = d3.axisLeft(scales.yScale);

  yAxis = bounds.append("g").call(yAxisGenerator);

  yAxisLabel = yAxis
    .append("text")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .attr("fill", "black")
    .text("Life expectancy at birth")
    .style("font-size", "1.4em")
    .style("transform", "rotate(-90deg)")
    .style("text-anchor", "middle");

  scales.areaScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataSet.map(row => row["Population"]))])
    .range([3, 50]);

  colorScheme5 = ["#DEEDCF", "#74C67A", "#1D9A6C", "#137177", "#0A2F51"];

  birthRateBins = [...birthRateBins].sort(
    (a, b) => +a.split("-")[0] - +b.split("-")[0]
  );

  scales.colorScale = d3
    .scaleOrdinal()
    .domain(birthRateBins)
    .range(colorScheme5);

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

  dots = bounds
    .selectAll("circle")
    .data(dataSet)
    .join("circle")
    .attr("cx", d => scales.xScale(d["GDP per capita"]))
    .attr("cy", d => scales.yScale(d["Life expectancy at birth"]))
    .attr("r", d => scales.areaScale(d["Population"]))
    .attr("rOriginal", d => scales.areaScale(d["Population"]))
    .style("fill", d => scales.colorScale(d["Birth rate bin"]))
    .style("opacity", "0.7")
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
    selectedScale.range(colorScheme5);
  }
}

drawFunction();
