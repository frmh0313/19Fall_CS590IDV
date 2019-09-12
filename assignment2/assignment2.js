let dataSet;
async function drawFunction() {
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
        return row;
      });
    });

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
    .domain([0, d3.max(dataSet.map(row => row["Life expectancy at birth"]))])
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
}

drawFunction();
