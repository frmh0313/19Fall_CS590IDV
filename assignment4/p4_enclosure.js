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

    // calDepth(this.dataSet, 0);
    calcDepth(this.dataSet, -1);
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
        that.updateRectangular(that.rootRectangular);
      } else {
        console.log("updateRadial");
        that.rootRadial = d3.hierarchy(that.dataSet);
        that.rootRadial.descendants().forEach((d, i) => {
          d.id = i;
          if (d.children) {
            d._children = d.children;
          }
        });
        // that.width = window.innerWidth * 0.6;
        that.width = 900;
        that.height = that.width;
        that.depthThreshold = 2;
        that.rootRadial = d3
          .hierarchy(that.dataSet)
          .sum(d => d.value)
          .sort((a, b) => b.value - a.value);
        that.updateRadial(that.rootRadial);
      }
    });
  }
  async draw() {
    await this.setData(this.dataSetPath);

    this.radioButtonDiv = this.wrapper.append("div");

    this.color = d3.scaleOrdinal(d3.schemeCategory10);

    this.format = d3.format(",d");

    const zeroingDirectoryValues = node => {
      if (node.children) {
        node.value = 0;
        node.children.forEach(child => zeroingDirectoryValues(child));
      }
    };

    zeroingDirectoryValues(this.dataSet);

    this.rootSquare = d3
      .hierarchy(this.dataSet)
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

    this.svg = this.wrapper
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("font", "10px sans-serif");

    this.setRadioButton();
    this.updateRectangular();
  }

  updateRadial() {
    this.svg
      .transition()
      .attr(
        "viewBox",
        `-${this.width / 2} -${this.height / 2} ${this.width} ${this.height}`
      )
      .style("display", "block");
  }

  updateRectangular() {
    this.width = this.height = 1200;
    if (this.svg) {
      this.svg.selectAll("g").remove();
      this.svg.remove();
    }

    this.svg = this.wrapper
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
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
