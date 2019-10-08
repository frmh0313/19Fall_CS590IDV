let dataSet;
let projection;
let us;
let airports;
let linkWidthScale;
let linkSaturationScale;
let statesColorScale;

function getRegion(state) {
  let regionEntry = Object.entries(regions).find(([regionName, states]) =>
    states.includes(state)
  );
  return regionEntry ? regionEntry[0] : null;
}

async function drawMap() {
  dataSet = await d3.json("./USAir97v2.json").then(airports => airports);
  console.log(dataSet);
  const width = 975;
  const height = 610;
  let dimensions = {
    width: d3.min([900, window.innerWidth * 0.9]),
    margin: {
      top: 10,
      right: 40,
      bottom: 40,
      left: 60
    }
  };

  us = topojson.feature(states, states.objects.states_20m_2017);
  projection = d3 //geoAlbersUsaPr()
    .geoAlbersUsa()
    .scale(1300)
    .translate([487.5, 305]);

  let path = d3.geoPath().projection(projection);

  d3.select("#wrapper").style("display", "inline-block");

  let bounds = d3
    .select("#wrapper")
    .append("svg")
    // .attr("viewBox", [0, 0, 975, 610]);
    .attr("width", width)
    .attr("height", height)
    .attr(
      "transform",
      `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
    )
    .style("float", "left");

  let legendArea = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", 250)
    .attr("height", height)

    .style("float", "left")
    .attr(
      "transform",
      `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
    );

  let regionNames = Object.keys(regions);

  statesColorScale = d3
    .scaleOrdinal()
    .domain(regionNames)
    .range(d3.schemeCategory10);
  // .range(d3.schemePastel1);
  // .range(d3.schemePastel2);

  let airportColorScale = d3
    .scaleOrdinal()
    .domain(regionNames)
    .range(d3.schemeCategory10);
  // .range(d3.schemeSet2);

  linkWidthScale = d3
    .scaleLinear()
    // .scaleSqrt()
    .domain(d3.extent(dataSet.links.map(link => link.value)))
    .range([0.5, 6]);

  linkSaturationScale = d3
    .scaleLinear()
    .domain(d3.extent(dataSet.links.map(link => link.value)))
    .range([0.5, 1]);

  console.log(statesColorScale.domain());

  let path_states = bounds
    .append("g")
    .attr("class", "paths")
    .selectAll(".state")
    .data(us.features)
    .join("path")
    .attr("class", "state")
    .attr("fill", d => statesColorScale(getRegion(d.properties.NAME)))
    .attr("stroke", "black")
    .attr("opacity", 0.3)
    .attr("d", path);

  console.log(statesColorScale.domain());
  airports = dataSet.nodes.map(airport => ({
    id: airport.id,
    name: airport.name,
    city: airport.city,
    degree: 0,
    state: airport.state,
    region: getRegion(airport.state),
    coordinates: projection([airport.longitude, airport.latitude]),
    importanceFactor: 0
  }));

  console.log("airports");
  console.log(airports);

  dataSet.links.forEach(link => {
    let source = airports.find(airport => airport.id == link.source);
    source.importanceFactor += link.value;
    source.degree += 1;

    let target = airports.find(airport => airport.id == link.target);
    target.importanceFactor += link.value;
    target.degree += 1;
  });

  let importanceFactorScale = d3
    .scaleLinear()
    .domain(d3.extent(airports.map(airport => airport.importanceFactor)))
    .range([5, 20]);

  console.log("airports after calculating importanceFactor");
  console.log(airports);
  let nullNodes = (() => {
    let nulls = [];

    airports.forEach((d, i) => {
      if (d.coordinates == null) nulls.push(i);
    });
    return nulls;
  })();

  console.log(nullNodes);

  let linkData = dataSet.links.filter(
    d => !nullNodes.includes(d.source) && !nullNodes.includes(d.target)
  );

  let links = bounds
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(linkData)
    .join("line")
    .attr("x1", d => airports[d.source].coordinates[0])
    .attr("y1", d => airports[d.source].coordinates[1])
    .attr("x2", d => airports[d.target].coordinates[0])
    .attr("y2", d => airports[d.target].coordinates[1])
    .attr("stroke", "#0055dd")
    .attr("stroke-opacity", d => linkSaturationScale(d.value))
    .attr("stroke-width", d => linkWidthScale(d.value))
    .on("mouseover", function() {
      linkMouseover(this);
    })
    .on("mousemove", d => linkMousemove(d))
    .on("mouseleave", function() {
      linkMouseleave(this);
    });

  let nodes = bounds
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(
      airports
        .filter(d => d.coordinates != null)
        .sort((a, b) => b.importanceFactor - a.importanceFactor)
    )
    .join("circle")
    .attr("airportId", d => d.id)
    .attr("cx", d => d.coordinates[0])
    .attr("cy", d => d.coordinates[1])
    .attr("r", d => importanceFactorScale(d.importanceFactor))
    .attr("fill", d => airportColorScale(d.region))
    // .attr("stroke", "black");
    .attr("stroke", "#444")
    .on("mouseover", function() {
      nodeMouseover(this);
    })
    .on("mousemove", d => nodeMousemove(d))
    .on("mouseleave", function() {
      nodeMouseleave(this);
    });

  let legendImportanceFactorsArea = legendArea
    .append("g")
    .attr("transform", `translate(10, 20)`);

  legendImportanceFactorsArea
    .append("g")
    .attr("class", "legendImportanceFactor")
    .attr("transform", "translate(0, 10)");

  let legendImportanceFactors = d3
    .legendSize()
    .scale(importanceFactorScale)
    .shape("circle")
    .shapePadding(20)
    .labelOffset(25)
    .title("Importance Factor")
    .orient("horizontal");

  legendArea.select(".legendImportanceFactor").call(legendImportanceFactors);

  legendArea.selectAll("circle").style("fill", "skyblue");
  let legendLinkArea = legendArea
    .append("g")
    .attr("transform", "translate(10, 130)");

  legendLinkArea.append("text").text("Frequency of Flights");

  const legendFrequency = legendLinkArea
    .append("g")
    .selectAll("line")
    .data([
      d3.min(linkData.map(link => link.value)),
      d3.mean(linkData.map(link => link.value)),
      d3.max(linkData.map(link => link.value))
    ])
    .join("line")
    .attr("x1", (d, i) => i * 50)
    .attr("x2", (d, i) => (i + 1) * 50)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke-width", d => linkWidthScale(d))
    .attr("stroke", "#0055dd")
    .attr("opacity", d => linkSaturationScale(d))
    .attr("transform", `translate(10, 20)`);

  const legendFrequencyLabels = legendLinkArea
    .append("g")
    .selectAll("text")
    .data([
      d3.min(linkData.map(link => link.value)),
      d3.mean(linkData.map(link => link.value)),
      d3.max(linkData.map(link => link.value))
    ])
    .join("text")
    .text(d => d3.format(".4f")(d))
    .attr("x", (d, i) => i * 50)
    .attr("y", 30)
    .attr("font-size", 10)
    .attr("text-anchor", "start")
    .attr("transform", "translate(10, 10)");

  const legendStatesColorArea = legendArea
    .append("g")
    .attr("transform", "translate(10, 200)");

  statesColorScale.domain(regionNames);
  let legendStatesColor = d3
    .legendColor()
    .scale(statesColorScale)
    .shapeWidth(40)
    .orient("vertical")
    .title("Regions");

  legendStatesColorArea.call(legendStatesColor);

  // tooltip
  function nodeMouseover(selection) {
    console.log("node mouseover");
    d3.select("#wrapper")
      .append("div")
      .attr("class", "nodeTooltip")
      .style("width", "auto")
      .style("height", "auto")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px");

    d3.select(selection)
      .style("stroke", "black")
      .attr("stroke-width", 2);
    // .raise();
    // d3.select(".nodes").attr("opacity", 0.4);
    // d3.select(".links").attr("opacity", 0.2);
  }

  function nodeMousemove(d) {
    console.log("node mousemove");

    d3.select(".nodeTooltip")
      .html(
        `
      <p>Airport: ${d.name} (${d.city}, ${d.state})</p>
      <p># of connections: ${d.degree}</p>
      <p>Importance factor: ${d3.format(".4f")(d.importanceFactor)}</p>
      `
      )
      .style("position", "absolute")
      .style("left", `${d3.event.pageX + 70}px`)
      .style("top", `${d3.event.pageY}px`);

    d3.select(".nodeTooltip").raise();
  }

  function nodeMouseleave(selection) {
    console.log("node mouseleave");
    d3.select(".nodeTooltip").remove();
    d3.select(selection)
      .style("stroke", "#888")
      .attr("stroke-width", 1);
  }

  function linkMouseover(selection) {
    console.log("link mouseover");
    d3.select("#wrapper")
      .append("div")
      .attr("class", "linkTooltip")
      .style("width", "auto")
      .style("height", "auto")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px");

    d3.select(selection)
      .attr("stroke", "red")
      .attr("opacity", 1)
      .attr("stroke-width", d => linkWidthScale(d.value) * 1.5)
      .raise();
  }

  function linkMousemove(d) {
    console.log("link mousemove");

    let source = airports.find(airport => airport.id == d.source);
    let target = airports.find(airport => airport.id == d.target);

    d3.select(".linkTooltip")
      .html(
        `
      <p>Flight</p>
      <p>From: ${source.name} (${source.city}, ${source.state}) 
      <p>To: ${target.name} (${target.city}, ${target.state})</p>
      <p>Frequency: ${d.value}</p>`
      )
      .style("position", "absolute")
      .style("left", `${d3.event.pageX + 70}px`)
      .style("top", `${d3.event.pageY + 70}px`);
    d3.select(".linkTooltip").raise();
  }

  function linkMouseleave(selection) {
    console.log("link mousemove");
    d3.select(".linkTooltip").remove();
    d3.select(selection)
      .attr("stroke", "#0055dd")
      .attr("stroke-opacity", d => linkSaturationScale(d.value))
      .attr("stroke-width", d => linkWidthScale(d.value));
  }
}
drawMap();
