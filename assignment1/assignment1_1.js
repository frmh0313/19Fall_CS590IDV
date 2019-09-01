// const d3 = require("d3");
"understanding description: three grouped bar charts associated with three origins.";
"Each grouped barchart shows the distribution of mpg of cars.";
"As the value of mpg, color changes";

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

  let carsWithModel = [];
  const dataSet = await d3.csv("./old_cars.csv").then(data => {
    return data.map(row => {
      let key = `${row.Car}_${row.Model}`;
      let obj = {};
      obj[key] = row.MPG;
      obj["Origin"] = row.Origin;
      return obj;
    });
  });

  console.log(dataSet);

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const yScale = d3
    .scaleLinear()
    .domain([0, 50])
    .range([dimensions.boundedHeight, 0]);

  const yAxisGenerator = d3.axisLeft().scale(yScale);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  const xScale1 = d3
    .scaleBand()
    .domain(["US", "Europe", "Japan"])
    .rangeRound([
      dimensions.margin.left,
      dimensions.width - dimensions.margin.right
    ])
    .padding(0.05);

  const xScale2 = d3.scaleBand().domain([]);
}

drawChart();
