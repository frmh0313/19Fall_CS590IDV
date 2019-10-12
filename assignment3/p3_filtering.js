let dataSet;
let projection;
let us;
let airports;
let linkData;
let linkWidthScale;
let linkSaturationScale;
let statesColorScale;
let airportsNullExcluded;

let slidersArea;
let importanceFactorSliderGenerator;
let frequencySliderGenerator;

function getRegion(state) {
  let regionEntry = Object.entries(regions).find(([regionName, states]) =>
    states.includes(state)
  );
  return regionEntry ? regionEntry[0] : null;
}

async function drawMap() {
  dataSet = await d3.json("./USAir97v2.json").then(airports => airports);
  console.log(dataSet);
  const width = 1000;
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
    .translate([500, 305]);

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

  let helpersArea = d3
    .select("#wrapper")
    .append("div")
    .style("display", "block")
    .style("float", "left");

  let legendArea = helpersArea
    .append("div")
    .append("svg")
    .attr("width", 250)
    // .attr("height", height)
    .attr("height", height - 300)
    .style("float", "left")
    .attr("transform", `translate(${dimensions.margin.left}, 60)`);

  let slidersArea = helpersArea
    .append("div")
    .style("position", "relative")
    .style("top", "70px")
    .style("left", `${dimensions.margin.left}px`)
    .style("display", "block")
    .style("float", "left");

  let regionNames = Object.keys(regions);

  statesColorScale = d3
    .scaleOrdinal()
    .domain(regionNames)
    .range(d3.schemeCategory10);

  let airportColorScale = d3
    .scaleOrdinal()
    .domain(regionNames)
    .range(d3.schemeCategory10);

  linkWidthScale = d3
    .scaleLinear()
    // .scaleSqrt()
    .domain(d3.extent(dataSet.links.map(link => link.value)))
    .range([0.5, 6]);

  linkSaturationScale = d3
    .scaleLinear()
    .domain(d3.extent(dataSet.links.map(link => link.value)))
    .range([0.5, 1]);

  // console.log(statesColorScale.domain());

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

  // console.log(statesColorScale.domain());
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

    airports.forEach(d => {
      if (d.coordinates == null) nulls.push(d.id);
    });
    return nulls;
  })();

  console.log(nullNodes);

  linkData = dataSet.links.filter(
    d => !nullNodes.includes(d.source) && !nullNodes.includes(d.target)
  );

  // this part - should also check other files.
  airportsNullExcluded = airports.filter(
    airport => airport.coordinates != null
  );
  let links = bounds
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(linkData)
    .join("line")
    .attr(
      "x1",
      d =>
        airportsNullExcluded.find(airport => airport.id == d.source)
          .coordinates[0]
    )
    .attr(
      "y1",
      d =>
        airportsNullExcluded.find(airport => airport.id == d.source)
          .coordinates[1]
    )
    .attr(
      "x2",
      d =>
        airportsNullExcluded.find(airport => airport.id == d.target)
          .coordinates[0]
    )
    .attr(
      "y2",
      d =>
        airportsNullExcluded.find(airport => airport.id == d.target)
          .coordinates[1]
    )
    .attr("stroke", "#0055dd")
    .attr("stroke-opacity", d => linkSaturationScale(d.value))
    .attr("stroke-width", d => linkWidthScale(d.value))
    .on("mouseover", function() {
      linkMouseover(this);
    })
    .on("mousemove", function(d) {
      linkMousemove(d);
    })
    .on("mouseleave", function(d) {
      linkMouseleave(d, this);
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
      .attr("stroke", "black")
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
      .attr("stroke", "#888")
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

    // console.log("mouseX: ", d3.event.pageX);
    // console.log("mouseY: ", d3.event.pageY);
    d3.select(".linkTooltip").raise();

    bounds
      .selectAll("circle")
      .filter(function() {
        return (
          d3.select(this).attr("airportId") == source.id ||
          d3.select(this).attr("airportId") == target.id
        );
      })
      .attr("stroke", "black")
      .attr("stroke-width", 2);
  }

  function linkMouseleave(d, selection) {
    console.log("link mouseleave");
    let source = airports.find(airport => airport.id == d.source);
    let target = airports.find(airport => airport.id == d.target);
    d3.select(".linkTooltip").remove();
    d3.select(selection)
      .attr("stroke", "#0055dd")
      .attr("stroke-opacity", d => linkSaturationScale(d.value))
      .attr("stroke-width", d => linkWidthScale(d.value));

    bounds
      .selectAll("circle")
      .filter(function() {
        return (
          d3.select(this).attr("airportId") == source.id ||
          d3.select(this).attr("airportId") == target.id
        );
      })
      .attr("stroke", "#444")
      .attr("stroke-width", 1);
  }

  let importanceFactorSliderArea = slidersArea.append("g");

  importanceFactorSliderArea
    .append("label")
    .text("Filtering by Importance factor");

  importanceFactorSliderGenerator = d3
    .sliderBottom()
    .min(d3.min(airports.map(airport => airport.importanceFactor)))
    .max(d3.max(airports.map(airport => airport.importanceFactor)))
    .width(200)
    .tickFormat(d3.format(".4f"))
    .ticks(5)
    .default(d3.min(airports.map(airport => airport.importanceFactor)))
    .handle(
      d3
        .symbol()
        .type(d3.symbolCircle)
        .size(100)
    )
    .fill("skyblue")
    .on("onchange", function(val) {
      console.log("importance Factor slider value: ", val);

      console.log("frequency slider value: ", frequencySliderGenerator.value());
      let importanceFactorFilteredAirports = airports
        .filter(d => d.coordinates != null)
        .filter(d => d.importanceFactor >= val)
        .sort((a, b) => b.importanceFactor - a.importanceFactor);

      console.log("importanceFactorfilteredAirports");
      console.log(importanceFactorFilteredAirports);
      let importanceFactorFilteredAirportsIds = importanceFactorFilteredAirports.map(
        airport => airport.id
      );

      console.log("importanceFactorFilteredAirportsIds");
      console.log(importanceFactorFilteredAirportsIds);
      // let importanceFactorFilteredFlights = linkData.filter(
      //   link =>
      //     importanceFactorFilteredAirportsIds.includes(link.source) &&
      //     importanceFactorFilteredAirportsIds.includes(link.target)
      // );

      let frequencyFilteredFlights = linkData.filter(
        link => link.value >= frequencySliderGenerator.value()
      );

      let filteredFlights = frequencyFilteredFlights.filter(
        link =>
          importanceFactorFilteredAirportsIds.includes(link.source) &&
          importanceFactorFilteredAirportsIds.includes(link.target)
      );

      let filteredFlightsAirportsIds = new Set([
        ...filteredFlights.map(flight => flight.source),
        ...filteredFlights.map(flight => flight.target)
      ]);

      console.log("filteredFlightsAirportsIds");
      console.log(filteredFlightsAirportsIds);
      let filteredAirports = importanceFactorFilteredAirports.filter(airport =>
        filteredFlightsAirportsIds.has(airport.id)
      );

      console.log("filtered Airports");
      console.log(filteredAirports);
      // console.log("filtered Airports");
      // console.log(importanceFactorFilteredAirports);

      d3.select(".nodes")
        .selectAll("circle")
        .data(filteredAirports)
        .join(enter =>
          enter
            .append("circle")
            .attr("airportId", d => d.id)
            .attr("cx", d => d.coordinates[0])
            .attr("cy", d => d.coordinates[1])
            .attr("r", d => importanceFactorScale(d.importanceFactor))
            .attr("fill", d => airportColorScale(d.region))
            .attr("stroke", "#444")
            .on("mouseover", function() {
              nodeMouseover(this);
            })
            .on("mousemove", d => nodeMousemove(d))
            .on("mouseleave", function() {
              nodeMouseleave(this);
            })
            .raise()
        );

      // console.log("filtered flights by importance factor");
      // console.log(importanceFactorFilteredFlights);

      d3.select(".links")
        .selectAll("line")
        .data(filteredFlights)
        .join("line")
        .attr(
          "x1",
          d =>
            filteredAirports.find(airport => airport.id == d.source)
              .coordinates[0]
        )
        .attr(
          "y1",
          d =>
            filteredAirports.find(airport => airport.id == d.source)
              .coordinates[1]
        )
        .attr(
          "x2",
          d =>
            filteredAirports.find(airport => airport.id == d.target)
              .coordinates[0]
        )
        .attr(
          "y2",
          d =>
            filteredAirports.find(airport => airport.id == d.target)
              .coordinates[1]
        )
        .attr("stroke", "#0055dd")
        .attr("stroke-opacity", d => linkSaturationScale(d.value))
        .attr("stroke-width", d => linkWidthScale(d.value))
        .on("mouseover", function() {
          linkMouseover(this);
        })
        .on("mousemove", function(d) {
          linkMousemove(d);
        })
        .on("mouseleave", function(d) {
          linkMouseleave(d, this);
        });
    });

  importanceFactorSlider = importanceFactorSliderArea
    .append("svg")
    .attr("width", 250)
    .attr("height", 100)
    .style("display", "block")
    .append("g")
    .attr("transform", "translate(15, 30)")
    .call(importanceFactorSliderGenerator);

  let frequencySliderArea = slidersArea.append("g");

  frequencySliderArea.append("label").text("Filtering by Frequency of flights");

  frequencySliderGenerator = d3
    .sliderBottom()
    .min(d3.min(linkData.map(link => link.value)))
    .max(d3.max(linkData.map(link => link.value)))
    .width(200)
    .tickFormat(d3.format(".4f"))
    .ticks(5)
    .default(d3.min(linkData.map(link => link.value)))
    .handle(
      d3
        .symbol()
        .type(d3.symbolCircle)
        .size(100)
    )
    .fill("skyblue")
    .on("onchange", function(val) {
      console.log("frequency slider value: ", val);

      let importanceFactorFilteredAirports = airports
        .filter(d => d.coordinates != null)
        .filter(
          d => d.importanceFactor >= importanceFactorSliderGenerator.value()
        )
        .sort((a, b) => b.importanceFactor - a.importanceFactor);

      let importanceFactorFilteredAirportsIds = importanceFactorFilteredAirports.map(
        airport => airport.id
      );

      // let importanceFactorFilteredFlights = linkData.filter(
      //   link =>
      //     importanceFactorFilteredAirportsIds.includes(link.source) &&
      //     importanceFactorFilteredAirportsIds.includes(link.target)
      // );

      let frequencyFilteredFlights = linkData.filter(link => link.value >= val);

      let filteredFlights = frequencyFilteredFlights.filter(
        link =>
          importanceFactorFilteredAirportsIds.includes(link.source) &&
          importanceFactorFilteredAirportsIds.includes(link.target)
      );

      let filteredFlightsAirportsIds = new Set([
        ...filteredFlights.map(flight => flight.source),
        ...filteredFlights.map(flight => flight.target)
      ]);

      let filteredAirports = importanceFactorFilteredAirports.filter(airport =>
        filteredFlightsAirportsIds.has(airport.id)
      );

      console.log("filtered Airports");
      console.log(filteredAirports);
      // // let frequencyFilteredAirportsIds = new Set([
      // //   ...frequencyFilteredFlights.map(flight => flight.source),
      // //   ...frequencyFilteredFlights.map(flight => flight.target)
      // // ]);

      // // let filteredFlights = importanceFactorFilteredFlights.filter(
      // //   flight =>
      // //     frequencyFilteredFlights.filter(
      // //       f => f.source == flight.source && f.target == flight.target
      // //     ).length > 0
      // // );

      // console.log("filtered flights in frequency");
      // console.log(filteredFlights);
      // let filteredFlightsSources = new Set([
      //   ...filteredFlights.map(flight => flight.source)
      // ]);

      // let filteredFlightsTargets = new Set([
      //   ...filteredFlights.map(flight => flight.target)
      // ]);

      // // let filteredFlightsAirportsIds = new Set([
      // //   ...filteredFlights.map(flight => flight.source),
      // //   ...filteredFlights.map(flight => flight.target)
      // // ]);

      // let filteredFlightsAirportsIds = new Set(
      //   filteredFlights
      //     .map(flight => flight.source)
      //     .filter(flight =>
      //       filteredFlights.map(flight => flight.target).includes(flight)
      //     )
      // );
      // console.log("filteredFlightsAirportsIds");
      // console.log(filteredFlightsAirportsIds);

      // let filteredAirports = importanceFactorFilteredAirports.filter(airport =>
      //   filteredFlightsAirportsIds.has(airport.id)
      // );

      // console.log("filtered Airports");
      // console.log(filteredAirports);

      d3.select(".nodes")
        .selectAll("circle")
        .data(filteredAirports)
        .join("circle")
        .attr("airportId", d => d.id)
        .attr("cx", d => d.coordinates[0])
        .attr("cy", d => d.coordinates[1])
        .attr("r", d => importanceFactorScale(d.importanceFactor))
        .attr("fill", d => airportColorScale(d.region))
        .attr("stroke", "#444")
        .on("mouseover", function() {
          nodeMouseover(this);
        })
        .on("mousemove", d => nodeMousemove(d))
        .on("mouseleave", function() {
          nodeMouseleave(this);
        });

      d3.select(".links")
        .selectAll("line")
        .data(filteredFlights)
        .join("line")
        .attr(
          "x1",
          d =>
            filteredAirports.find(airport => airport.id == d.source)
              .coordinates[0]
        )
        .attr(
          "y1",
          d =>
            filteredAirports.find(airport => airport.id == d.source)
              .coordinates[1]
        )
        .attr(
          "x2",
          d =>
            filteredAirports.find(airport => airport.id == d.target)
              .coordinates[0]
        )
        .attr(
          "y2",
          d =>
            filteredAirports.find(airport => airport.id == d.target)
              .coordinates[1]
        )
        .attr("stroke", "#0055dd")
        .attr("stroke-opacity", d => linkSaturationScale(d.value))
        .attr("stroke-width", d => linkWidthScale(d.value))
        .on("mouseover", function() {
          linkMouseover(this);
        })
        .on("mousemove", function(d) {
          linkMousemove(d);
        })
        .on("mouseleave", function(d) {
          linkMouseleave(d, this);
        });
    });

  frequencySlider = frequencySliderArea
    .append("svg")
    .attr("width", 250)
    .attr("height", 100)
    .style("display", "block")
    .append("g")
    .attr("transform", `translate(15, 30)`)
    .call(frequencySliderGenerator);
}

drawMap();
