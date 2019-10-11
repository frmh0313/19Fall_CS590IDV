async function drawChart() {
  let dimensions = {
    width: 1200,
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

  dataSet = await d3.json("./USAir97.json").then(data => {
    console.log(data);
    return data;
  });

  console.log(dataSet);

  const nodeData = dataSet.nodes;
  console.log("nodes");
  console.log(nodeData);
  const linkData = dataSet.links;

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  bounds = wrapper
    .append("g")
    .attr("viewBox", [0, 0, 1000, 700])
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const links = dataSet.links.map(d => Object.create(d));
  const nodes = dataSet.nodes.map(d => Object.create(d));

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id(d => d.id)
      // .strength(-1)
    )
    .force("charge", d3.forceManyBody().strength(-15))
    .force("collision", d3.forceCollide().radius(5))
    .force(
      "center",
      d3.forceCenter(dimensions.boundedWidth / 2, dimensions.boundedHeight / 2)
    )
    .on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("cx", d => d.x).attr("cy", d => d.y);
    });

  const link = bounds
    .append("g")
    .attr("stroke", "#0055dd")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", 1);

  const node = bounds
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 5);
}

drawChart();
