let dataSet;
let bounds;
let dots;

async function draw() {
  let dimensions = {
    width: 1100,
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

  dataSet = await d3.json("./USAir97.json").then(data => data);

  const nodes = dataSet.nodes;

  const links = dataSet.links;

  const wrapper = d3
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

  let projection = d3
    .geoAlbersUsa()
    .translate([dimensions.boundedWidth / 2, dimensions.boundedHeight / 2])
    .scale([1280]);

  let path = d3.geoPath();
  // .projection(projection);

  const us = await d3
    .json("https://cdn.jsdelivr.net/npm/us-atlas@1/us/10m.json")
    .then(us => {
      bounds
        .append("path")
        .datum(topojson.mesh(us, us.objects.states))
        .attr("fill", "none")
        .attr("stroke", "#777")
        .attr("stroke-width", 0.5)
        .attr("stroke-linejoin", "round")
        .attr("d", path);
    });

  bounds
    .selectAll("circle")
    .data(dataSet.nodes)
    .join("circle")
    .attr("r", 5)
    .attr(
      "transform",
      d => `translate(${projection[(d.longitude, d.latitude)]})`
    );
}
draw();
