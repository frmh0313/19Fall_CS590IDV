class Chart {
  constructor(opts) {
    this.dataSetPath = opts.dataSetPath;
    this.wrapper = opts.element;
    this.draw();
  }

  async draw() {
    this.dimensions = {
      width: 800,
      height: 700,
      margin: {
        top: 15,
        right: 15,
        bottom: 40,
        left: 60
      }
    };

    this.dimensions.boundedHeight =
      this.dimensions.height -
      this.dimensions.margin.top -
      this.dimensions.margin.bottom;
    this.dimensions.boundedWidth =
      this.dimensions.width -
      this.dimensions.margin.left -
      this.dimensions.margin.right;

    this.bounds = this.wrapper
      .append("svg")
      .attr("width", this.dimensions.width)
      .attr("height", this.dimensions.height)
      .append("g")
      .style(
        "transform",
        `translate(${this.dimensions.margin.left}px, ${this.dimensions.margin.top}px)`
      );

    this.dataSet = await d3.text(this.dataSetPath).then(data => {
      let lines = data.split("\n");
      let sizePathpairs = lines.map(line => ({
        size: line.split("\t")[0],
        path: line.split("\t")[1]
      }));
      return sizePathpairs;
    });
  }
}
