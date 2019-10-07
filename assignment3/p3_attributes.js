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
    .scale(1300)
    .translate([487.5, 305]);

  let path = d3.geoPath().projection(projection);

  let bounds = d3
    .select("#wrapper")
    .append("svg")
    // .attr("viewBox", [0, 0, 975, 610]);
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
  // .range(d3.schemePastel1);
  // .range(d3.schemePastel2);

  let airportColorScale = d3
    .scaleOrdinal()
    .domain(regionNames)
    .range(d3.schemeCategory10);
  // .range(d3.schemeSet2);

  let linkWidthScale = d3
    .scaleLinear()
    .domain(d3.extent(dataSet.links.map(link => link.value)))
    .range([0.3, 2]);

  let linkSaturationScale = d3
    .scaleLinear()
    .domain(d3.extent(dataSet.links.map(link => link.value)))
    .range([0.5, 1]);

  let path_states = bounds
    .selectAll(".state")
    .data(us.features)
    .join("path")
    .attr("class", "state")
    .attr("fill", d => statesColorScale(getRegion(d.properties.NAME)))
    // .attr("fill", d => airportColorScale(getRegion(d.properties.NAME)))
    .attr("stroke", "black")
    .attr("opacity", 0.5)
    .attr("d", path);

  airports = dataSet.nodes.map(airport => ({
    id: airport.id,
    state: airport.state,
    region: getRegion(airport.state),
    coordinates: projection([airport.longitude, airport.latitude]),
    impactFactor: 0
  }));

  console.log("airports");
  console.log(airports);

  dataSet.links.forEach(link => {
    airports.find(airport => airport.id == link.source).impactFactor +=
      link.value;
  });

  let impactFactorScale = d3
    .scaleLinear()
    .domain(d3.extent(airports.map(airport => airport.impactFactor)))
    .range([3, 20]);

  console.log("airports after calculating impactFactor");
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
    .attr("stroke", "#0055dd")
    .attr("stroke-opacity", d => linkSaturationScale(d.value))
    .attr("stroke-width", d => {
      console.log(d.value);
      return linkWidthScale(d.value);
    });
  // .attr("stroke-width", 3);
  // .attr("stroke-width", 0.3);
  // .attr("stroke-width", d => d.value * 3);

  let nodes = bounds
    .selectAll("circle")
    .data(airports.filter(d => d.coordinates != null))
    .join("circle")
    .attr("cx", d => d.coordinates[0])
    .attr("cy", d => d.coordinates[1])
    .attr("r", d => impactFactorScale(d.impactFactor))
    .attr("fill", d => airportColorScale(d.region))
    .attr("stroke", "#000");
}
drawMap();
