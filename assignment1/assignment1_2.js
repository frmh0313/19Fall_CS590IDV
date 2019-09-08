let origins = ["US", "Europe", "Japan"];
let dataSet;
function* years() {
  let i = 70;
  while (i <= 82) {
    yield i++;
  }
}

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
  /* annual sum data
    [
      {Origin: US, annualSum: [{ year: 70, sum: _, count: _}, ... {year: 82, sum: _, count: _}]},
      {Origin: Europe, annualSum: [{ year: 70, sum: _, count: _}, ... {year: 82, sum: _, count: _}]},
      {Origin: Japan, annualSum: [{ year: 70, sum: _, count: _}, ... {year: 82, sum: _, count: _}]}
    ]
    */

  // console.log(annualSumData);

  /* final data (annual average data)
  [
    {Origin: US, avgValues: {70: _, 71: _, ... 82: _}}, 
    {Origin: Europe, avgValues: {70: _, 71: _, ... 82: _}}, 
    {Origin: Japan, avgValues: {70: _, 71: _, ... 82: _}}
    ]
    */

  dataSet = await d3
    .csv("./old_cars.csv")
    .then(data => {
      let annualSumData = origins.map(origin => {
        let annualSums = [];

        for (year of years()) {
          annualSums.push({ year: year, sum: 0, count: 0 });
        }
        return { Origin: origin, annualSum: annualSums };
      });

      data.forEach(row => {
        let yearData = annualSumData
          .filter(el => el.Origin == row.Origin)[0]
          .annualSum.filter(annualData => annualData.year == row.Model)[0];
        yearData.sum += +row.MPG;
        yearData.count += 1;
      });
      return annualSumData;
    })
    .then(data => {
      return origins.map(origin => {
        let annualSumData = data.filter(d => d.Origin == origin)[0].annualSum;
        let annualAvgData = [];

        for (year of years()) {
          let yearSumData = annualSumData.filter(el => el.year == year)[0];
          annualAvgData.push({
            year,
            avg: +yearSumData.sum / +yearSumData.count
          });
        }
        return { origin, annualAvg: annualAvgData };
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
    .domain([0, d3.max(dataSet.flatMap(r => r.annualAvg.map(el => el.avg)))])
    .range([dimensions.boundedHeight, 0]);

  const yAxisGenerator = d3.axisLeft(yScale);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  const yAxisLabel = yAxis
    .append("text")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .attr("fill", "black")
    .style("font-size", "1.4em")
    .text("Average MPG")
    .style("transform", "rotate(-90deg)")
    .style("text-anchor", "middle");

  const xScale = d3
    .scaleBand()
    .domain([...years()])
    .rangeRound([0, dimensions.boundedWidth])
    .padding(0.9);

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
    .style("font-size", "1.4em")
    .text("Year");

  const color = d3
    .scaleOrdinal()
    .domain(origins)
    .range(d3.schemeCategory10);

  const lineGenerator = d3
    .line()
    .x(d => xScale(+d.year))
    .y(d => yScale(+d.avg));

  const legend = bounds
    .append("g")
    .attr("transform", `translate(${dimensions.boundedWidth}, 0)`)
    .attr("text-anchor", "end")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("g")
    .data(color.domain().slice())
    .join("g")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legend
    .append("rect")
    .attr("x", -19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", color);

  legend
    .append("text")
    .attr("x", -24)
    .attr("y", 9.5)
    .attr("dy", "0.35em")
    .text(d => d);

  const usLine = bounds
    .append("path")
    .attr(
      "d",
      lineGenerator(dataSet.filter(r => r.origin == "US")[0].annualAvg)
    )
    .attr("fill", "none")
    .attr("stroke", color("US"))
    .attr("stroke-width", 2);

  const usDots = bounds
    .append("g")
    .selectAll("g")
    .data(dataSet)
    .join("g")
    .selectAll("circle")
    .data(dataSet.filter(r => r.origin == "US")[0].annualAvg)
    .join("circle")
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.avg))
    .attr("r", 5)
    .attr("fill", color("US"));

  const europeLine = bounds
    .append("path")
    .attr(
      "d",
      lineGenerator(dataSet.filter(r => r.origin == "Europe")[0].annualAvg)
    )
    .attr("fill", "none")
    .attr("stroke", color("Europe"))
    .attr("stroke-width", 2);

  const europeDots = bounds
    .append("g")
    .selectAll("g")
    .data(dataSet)
    .join("g")
    .selectAll("circle")
    .data(dataSet.filter(r => r.origin == "Europe")[0].annualAvg)
    .join("circle")
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.avg))
    .attr("r", 5)
    .attr("fill", color("Europe"));

  const japanLine = bounds
    .append("path")
    .attr(
      "d",
      lineGenerator(dataSet.filter(r => r.origin == "Japan")[0].annualAvg)
    )
    .attr("fill", "none")
    .attr("stroke", color("Japan"))
    .attr("stroke-width", 2);

  const japanDots = bounds
    .append("g")
    .selectAll("g")
    .data(dataSet)
    .join("g")
    .selectAll("circle")
    .data(dataSet.filter(r => r.origin == "Japan")[0].annualAvg)
    .join("circle")
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.avg))
    .attr("r", 5)
    .attr("fill", color("Japan"));
}

drawChart();
