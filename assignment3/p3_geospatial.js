let dataSet;
let projection;
let us;
let airports;

function getRegion(state) {
  let regionEntry = Object.entries(regions).find(([regionName, states]) =>
    states.includes(state)
  );
  return regionEntry ? regionEntry[0] : null;
}

async function drawMap() {
  dataSet = await d3.json("./USAir97v2.json").then(airports => airports);
  console.log(dataSet);
  const width = 970;
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
    .scale(1150)
    .translate([487.5, 305]);

  let path = d3.geoPath().projection(projection);

  let bounds = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", 975)
    .attr("height", 610)
    .attr(
      "transform",
      `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
    );

  let regionNames = Object.keys(regions);

  let statesColorScale = d3
    .scaleOrdinal()
    .domain(regionNames)
    .range(d3.schemeCategory10);

  let airportColorScale = d3
    .scaleOrdinal()
    .domain(regionNames)
    .range(d3.schemeCategory10);

  let path_states = bounds
    .selectAll(".state")
    .data(us.features)
    .join("path")
    .attr("class", "state")
    .attr("fill", d => statesColorScale(getRegion(d.properties.NAME)))
    .attr("stroke", "black")
    .attr("opacity", 0.3)
    .attr("d", path);

  airports = dataSet.nodes.map(airport => ({
    state: airport.state,
    region: getRegion(airport.state),
    coordinates: projection([airport.longitude, airport.latitude])
  }));

  console.log("airports");
  console.log(airports);

  let nullNodes = (() => {
    let nulls = [];
    airports.forEach((d, i) => {
      if (d.coordinates == null) nulls.push(i);
    });
    return nulls;
  })();

  console.log(nullNodes);

  // console.log(dataSet.links);

  let links = bounds
    .selectAll("line")
    .data(
      dataSet.links.filter(
        d => !nullNodes.includes(d.source) && !nullNodes.includes(d.target)
      )
    )
    .join("line")
    .attr("x1", d => airports[d.source].coordinates[0])
    .attr("y1", d => airports[d.source].coordinates[1])
    .attr("x2", d => airports[d.target].coordinates[0])
    .attr("y2", d => airports[d.target].coordinates[1])
    .attr("stroke", "blue")
    .attr("stroke-opacity", 0.7)
    .attr("stroke-width", 0.3);
  // .attr("stroke-width", d => d.value * 3);

  let nodes = bounds
    .selectAll("circle")
    .data(airports.filter(d => d.coordinates != null))
    .join("circle")
    .attr("cx", d => d.coordinates[0])
    .attr("cy", d => d.coordinates[1])
    .attr("r", 3)
    .attr("fill", d => airportColorScale(d.region))
    .attr("stroke", "#000");
}
drawMap();
