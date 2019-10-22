class Chart {
  constructor(opts) {
    this.dataSetPath = opts.dataSetPath;
    this.wrapper = opts.element;
    this.draw();
  }

  async setData(path) {
    this.dataSet = await d3.json("./filesystem_new.json").then(data => data);

    const calcDepth = (node, depth) => {
      node.depth = depth;
      if (node.children) {
        node.children.forEach(child => calcDepth(child, node.depth + 1));
      }
    };

    calcDepth(this.dataSet, 0);
    console.log(this.dataSet);
  }

  setRadioButton() {
    const that = this;

    this.radioButtonDiv
      .append("input")
      .attr("type", "radio")
      .attr("name", "layout")
      .attr("id", "rectangular")
      .attr("checked", true)
      .attr("value", "rectangular");

    this.radioButtonDiv
      .append("label")
      .attr("for", "rectangular")
      .text("Rectangular");

    this.radioButtonDiv
      .append("input")
      .attr("type", "radio")
      .attr("name", "layout")
      .attr("id", "radial")
      .attr("value", "radial");

    this.radioButtonDiv
      .append("label")
      .attr("for", "radial")
      .text("Radial Layout");

    d3.selectAll(`input[name="layout"]`).on("change", function() {
      if (this.value == "rectangular") {
        console.log("updateRectangular");
        that.updateRectangular();
      } else {
        console.log("updateRadial");
        that.rootRadial = d3.hierarchy(that.dataSet);

        that.width = that.height = 1200;
        that.rootRadial = d3
          .hierarchy(that.dataSet)
          .sum(d => d.value)
          .sort((a, b) => b.value - a.value);
        that.updateRadial();
      }
    });
  }
  async draw() {
    await this.setData(this.dataSetPath);

    this.radioButtonDiv = this.wrapper.append("div");

    this.color = d3.scaleOrdinal(d3.schemeCategory10);

    this.format = d3.format(",d");

    this.dataSetSquare = Object.assign({}, this.dataSet);
    const zeroingDirectoryValues = node => {
      if (node.children) {
        node.value = 0;
        node.children.forEach(child => zeroingDirectoryValues(child));
      }
    };

    zeroingDirectoryValues(this.dataSetSquare);

    this.rootSquare = d3
      .hierarchy(this.dataSetSquare)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    this.rootSquare.descendants().forEach((d, i) => {
      d.id = i;
    });

    this.width = this.height = 1200;

    this.treemap = d3
      .treemap()
      .tile(d3.treemapSquarify)
      .size([this.width, this.height])
      .padding(1)
      .round(true);

    this.setRadioButton();
    this.updateRectangular();
  }

  updateRadial() {
    const radialColor = d3
      .scaleLinear()
      .domain([0, 5])
      .range(["hsl(152,80%,80%)", "hsl(228,30%,50%)"])
      .interpolate(d3.interpolateHcl);

    this.width = this.height = 1200;

    const pack = data =>
      d3
        .pack()
        .size([this.width, this.height])
        .padding(3)(
        d3
          .hierarchy(data)
          .sum(d => d.value)
          .sort((a, b) => b.value - a.value)
      );

    const root = pack(this.dataSetSquare);

    this.svg.remove();

    this.svg = this.wrapper
      .append("svg")
      .attr(
        "viewBox",
        `-${this.width / 2} -${this.height / 2} ${this.width} ${this.height}`
      )
      .style("display", "block")
      .style("margin", "0 -14px")
      .style("background", radialColor(0));

    const k = this.width / (root.r * 2);

    const node = this.svg
      .append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
      .attr("fill", d => (d.children ? radialColor(d.depth) : "white"))
      .attr(
        "transform",
        d => `translate(${(d.x - root.x) * k}, ${(d.y - root.y) * k})`
      )
      .attr("r", d => d.r * k)
      .on("mouseover", function() {
        d3.select(this).attr("stroke", "#000");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", null);
      });

    const nodeTitle = node.append("title").text(
      d =>
        `${d
          .ancestors()
          .map(d => d.data.name)
          .reverse()
          .join("/")}\n${this.format(d.value)}`
    );

    const label = this.svg
      .append("g")
      .style("font", "12px sans-serif")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .attr(
        "transform",
        d => `translate(${(d.x - root.x) * k}, ${(d.y - root.y) * k})`
      )
      .style("fill-opacity", d => (d.parent === root ? 1 : 0))
      .style("display", d => (d.parent === root ? "inline" : "none"))
      .text(d => d.data.name);
  }

  updateRectangular() {
    this.width = this.height = 1200;
    if (this.svg) {
      this.svg.selectAll("g").remove();
      this.svg.remove();
    }

    this.svg = this.wrapper
      .append("svg")
      .attr("viewBox", [0, 0, this.width, this.height])
      .style("font", "10px sans-serif");

    const root = this.treemap(this.rootSquare);

    const leaf = this.svg
      .selectAll("g")
      .data(this.rootSquare.leaves())
      .join("g")
      .attr("transform", d => `translate(${d.x0}, ${d.y0})`);

    leaf.append("title").text(
      d =>
        `${d
          .ancestors()
          .reverse()
          .map(d => d.data.name)
          .join("/")}\n${this.format(d.value)}`
    );

    leaf
      .append("rect")
      .attr("id", d => d.data.id)
      .attr("fill", d => {
        while (d.depth > 1) d = d.parent;
        return this.color(d.data.name);
      })
      .attr("fill-opacity", 0.6)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);

    leaf
      .append("clipPath")
      .attr("id", d => `clip-${d.data.id}`)
      .append("use")
      .attr("xlink:href", d => `#${d.data.id}`);

    leaf
      .append("text")
      .attr("clipPath", d => `url(#clip-${d.data.id})`)
      .selectAll("tspan")
      .data(d =>
        d.data.name.split(/(?=[A-Z][^A-Z])/g).concat(this.format(d.value))
      )
      .join("tspan")
      .attr("x", 3)
      .attr(
        "y",
        (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
      )
      .attr("fill-opacity", (d, i, nodes) =>
        i === nodes.length - 1 ? 0.7 : null
      )
      .text(d => d);
  }
}
