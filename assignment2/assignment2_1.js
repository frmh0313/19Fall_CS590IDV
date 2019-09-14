let dataSet;
let birthRateScale;
let birthRateBins = new Set();

function findBirthRateBin(value) {
  return `${value / 10}0-${value / 10}9`;
}

async function drawFunction() {
  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 700,
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
      let keys = Object.keys(data[0]);
      keys = keys.filter(key => key != "Country");

      return data.map(row => {
        keys.forEach(key => {
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
        });

        row["Birth rate bin"] = findBirthRateBin(row["Birth rate"]);
        birthRateBins.add(row["Birth rate bin"]);

        return row;
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

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataSet.map(row => row["GDP per capita"]))])
    .range([0, dimensions.boundedWidth]);

  const xAxisGenerator = d3.axisBottom(xScale);

  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  const xAxisLabel = xAxis
    .append("text")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .attr("font-size", "1.4em")
    .text("GDP per capita");

  const yScale = d3
    .scaleLinear()
    // .domain([0, d3.max(dataSet.map(row => row["Life expectancy at birth"]))])
    .domain([0, 90])
    .range([dimensions.boundedHeight, 0]);

  const yAxisGenerator = d3.axisLeft(yScale);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  const yAxisLabel = yAxis
    .append("text")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .attr("fill", "black")
    .text("Life expectancy at birth")
    .style("font-size", "1.4em")
    .style("transform", "rotate(-90deg)")
    .style("text-anchor", "middle");

  const areaScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataSet.map(row => row["Population"]))])
    .range([3, 50]);

  const colorScheme5 = ["#DEEDCF", "#74C67A", "#1D9A6C", "#137177", "#0A2F51"];

  const sortedBirthRateBins = [...birthRateBins].sort(
    (a, b) => +a.split("-")[0] - +b.split("-")[0]
  );

  birthRateScale = d3
    .scaleOrdinal()
    .domain(sortedBirthRateBins)
    .range(colorScheme5);

  const dots = bounds
    .selectAll("circle")
    .data(dataSet)
    .join("circle")
    .attr("cx", d => xScale(d["GDP per capita"]))
    .attr("cy", d => yScale(d["Life expectancy at birth"]))
    .attr("r", d => areaScale(d["Population"]))
    .style("fill", d => birthRateScale(d["Birth rate bin"]))
    .style("opacity", "0.7")
    .attr("stroke", "black");
}

drawFunction();
