let dataSet;
let birthRateScale;

async function drawFunction() {
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
    .domain([0, 45000])
    .range([0, dimensions.boundedWidth]);

  const xAxisGenerator = d3.axisBottom(xScale);

  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  const xAxisLabel = xAxis
    .append("text")
    .attr("x", (dimensions.boundedWidth * 5) / 6)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .attr("font-size", "1.4em")
    .text("GDP per capita");

  const yScale = d3
    .scaleLinear()
    .domain([0, 90])
    .range([dimensions.boundedHeight, 0]);

  const yAxisGenerator = d3.axisLeft(yScale);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  const yAxisLabel = yAxis
    .append("text")
    .attr("x", dimensions.margin.left + 30)
    .attr("y", dimensions.margin.top + 10)
    .attr("fill", "black")
    .text("Life expectancy at birth")
    .style("font-size", "1.4em")
    .style("text-anchor", "middle");

  const areaScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataSet.map(row => row["Population"]))])
    .range([3, 50]);

  birthRateScale = d3
    .scaleSequential(d3.interpolateGreens)
    .domain([
      d3.min(dataSet.map(row => row["Birth rate"])),
      d3.max(dataSet.map(row => row["Birth rate"]))
    ]);

  const dots = bounds
    .append("g")
    .selectAll("circle")
    .data(dataSet.sort((a, b) => b["Population"] - a["Population"]))
    .join("circle")
    .attr("cx", d => xScale(d["GDP per capita"]))
    .attr("cy", d => yScale(d["Life expectancy at birth"]))
    .attr("r", d => areaScale(d["Population"]))
    .style("fill", d => birthRateScale(d["Birth rate"]))
    .style("opacity", "0.7")
    .attr("stroke", "black");

  // legends
  // Birth rate Legends
  const legendBirthRate = bounds.append("g");

  const legendBirthRateScale = d3
    .legendColor()
    .shapeWidth(30)
    .cells(7)
    .orient("horizontal")
    .scale(birthRateScale);

  const legendBirthRateBars = legendBirthRate
    .append("g")
    .attr("transform", `translate(500, 400)`);

  const legendBirthRateTitle = legendBirthRate
    .append("text")
    .attr("x", 500)
    .attr("y", 390)
    .attr("dy", "0.35em")
    .text("Birth rate");

  legendBirthRateBars.call(legendBirthRateScale);

  // Population legends
  let valuesToShow = [50000000, 500000000, 1000000000, 1500000000];
  let valuesToShowAbbr = ["50M", "500M", "1B", "1.5B"];
  let xCircle = 550;
  let xLabel = xCircle + 150;
  let yCircle = 600;

  const legendPopulation = bounds.append("g");

  const legendPopulationTitle = legendPopulation
    .append("text")
    .attr("x", 500)
    .attr("y", 470)
    .attr("dy", "0.35em")
    .text("Population");

  const legendPopulationCircles = legendPopulation
    .selectAll("circle")
    .data(valuesToShow)
    .join("circle")
    .attr("cx", xCircle)
    .attr("cy", d => yCircle - areaScale(d))
    .attr("r", d => areaScale(d))
    .style("fill", "none")
    .attr("stroke", "black");

  const legendPopulationLines = bounds
    .append("g")
    .selectAll("line")
    .data(valuesToShow)
    .join("line")
    .attr("x1", d => xCircle + areaScale(d))
    .attr("x2", xLabel)
    .attr("y1", d => yCircle - areaScale(d))
    .attr("y2", d => yCircle - areaScale(d))
    .attr("stroke", "black")
    .style("stroke-dasharray", "2,2");

  const legendPopulationLabels = bounds
    .append("g")
    .selectAll("text")
    .data(valuesToShow)
    .join("text")
    .attr("x", xLabel)
    .attr("y", d => yCircle - areaScale(d))
    .text((d, i) => valuesToShowAbbr[i])
    .style("font-size", 10)
    .attr("alignment-baseline", "middle");
}

drawFunction();
