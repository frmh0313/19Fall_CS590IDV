let dataSet;
let bounds;
let dots;

// const width = d3.min([window.innerWidth * 0.9, window.innerHeight * 0.9]);

async function draw() {
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

  dataSet = await d3.json("./USAir97.json").then(data => {
    console.log(data);
    return data;
  });

  console.log(dataSet);

  const nodes = dataSet.nodes;
  console.log("nodes");
  console.log(nodes);
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

  const xAccessor = d => d.posx;
  const yAccessor = d => d.posy;

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(nodes, xAccessor))
    .range([0, dimensions.boundedWidth]);

  console.log("xScale domain: ", xScale.domain());
  console.log("xScale range: ", xScale.range());

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(nodes, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  console.log("yScale domain: ", yScale.domain());
  console.log("yScale range: ", yScale.range());

  let simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(5))
    .force(
      "center",
      // d3.forceCenter(dimensions.boundedWidth / 2, dimensions.boundedHeight / 2)
      d3.forceCenter(650 + dimensions.margin.top, 420 + dimensions.margin.left)
      // d3.forceCenter(440, 420)
      // d3.forceCenter(464, 437)
    )
    .force("collision", d3.forceCollide().radius(5))
    .on("tick", ticked);

  function ticked() {
    bounds
      .selectAll("circle")
      .data(nodes)
      .join(
        enter => enter.append("circle").attr("r", 5),
        // update => update.attr("cx", d => d.x).attr("cy", d => d.y),
        update =>
          update
            .attr("cx", d => xScale(xAccessor(d)))
            .attr("cy", d => yScale(yAccessor(d))),
        exit => exit.remove()
      );
  }

  console.log(dataSet);
}
draw();
