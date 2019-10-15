class Chart {
  constructor(opts) {
    this.dataSetPath = opts.dataSetPath;
    this.wrapper = opts.element;

    this.draw();
  }

  async setData(path) {
    this.dataSet = await d3.text(path).then(data => {
      let lines = data.split("\n");
      let sizePathNameObject = lines
        .map(line => ({
          size: line.split("\t")[0],
          path: line.split("\t")[1].split("/")
        }))
        .map(line => {
          let nameIndex = line.path.length - 1;
          return {
            ...line,
            name: line.path[nameIndex]
          };
        });

      let arr = [];
      sizePathNameObject.forEach(file => {
        let size = file.size;
        // prev: {[]}, curr: children arr

        file.path.reduce((prev, curr, i, arr) => {
          let newChild = {};
          if (!prev.some(dir => dir.name == curr)) {
            newChild.name = curr;
            newChild.depth = i;
            prev.push(newChild);
          }
          if (i === arr.length - 1) {
            let leaf = prev.find(dir => dir.name == curr);
            leaf.size = size;
            leaf.depth = i;
            return leaf;
          }

          let currElement = prev.find(dir => dir.name == curr);
          if (!currElement.hasOwnProperty("children")) {
            currElement.children = [];
          }
          return currElement.children;
        }, arr);
      });

      return arr[0];
    });
  }

  tree(data) {
    const root = d3.hierarchy(data);
    // this.width = 1500;
    this.width = window.innerWidth * 0.9;
    root.dx = 15;
    root.dy = this.width / (root.height + 1);
    return d3.tree().nodeSize([root.dx, root.dy])(root);
  }

  async draw() {
    await this.setData(this.dataSetPath);

    const root = this.tree(this.dataSet);

    let x0 = Infinity;
    let x1 = -x0;
    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    this.bounds = d3
      .select("#wrapper")
      .append("svg")
      .attr("viewBox", [0, 0, this.width, x1 - x0 + root.dx * 2])
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("transform", `translate(${root.dy / 3}, ${root.dx - x0})`);

    const link = this.bounds
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x(d => d.y)
          .y(d => d.x)
      );

    const node = this.bounds
      .append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", d => `translate(${d.y}, ${d.x})`);

    node
      .append("circle")
      .attr("fill", d => (d.children ? "#555" : "#999"))
      .attr("r", 2.5);

    node
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", d => (d.children ? -6 : 6))
      .attr("text-anchor", d => (d.children ? "end" : "start"))
      .text(d => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke", "white");
  }
}
