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

      // parsing given data for tree
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
    this.width = window.innerWidth * 0.9;
    this.diagonal = d3
      .linkHorizontal()
      .x(d => d.y)
      .y(d => d.x);
    root.dx = 15;
    root.dy = this.width / (root.height + 1);
    return d3.tree().nodeSize([root.dx, root.dy])(root);
  }

  update(source) {
    const nodes = this.root.descendants().reverse();
    const links = this.root.links();
    const duration = d3.event && d3.event.altKey ? 2500 : 250;

    const transition = this.bounds
      .transition()
      .duration(duration)
      .attr("viewBox", [0, 0, this.width, this.x1 - this.x0 + this.root.dx * 2])
      .tween(
        "resize",
        window.ResizeObserver
          ? null
          : () => () => this.bounds.dispatch("toggle")
      );

    const node = this.gNode.selectAll("g").data(nodes, d => d.id);

    const nodeEnter = node
      .join("g")
      // .attr("transform", d => `translate(${source.dy}, ${source.dx})`)
      .attr("transform", d => `translate(${source.y}, ${source.x})`)
      // .attr("transform", d => `translate(${d.y}, ${d.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", d => {
        d.children = d.children ? null : d._children;
        this.update(d);
      });

    nodeEnter
      .append("circle")
      .attr("r", 2.5)
      .attr("fill", d => (d._children ? "#555" : "#999"));

    nodeEnter
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", d => (d._children ? -6 : 6))
      .attr("text-anchor", d => (d._children ? "end" : "start"))
      .text(d => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white");

    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      // .attr("transform", d => `translate(${source.y}, ${source.x})`)
      .attr("transform", d => `translate(${d.y}, ${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    const nodeExit = node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", d => `translate(${source.y}, ${source.x})`)
      // .attr("transform", d => `translate(${source.dy}, ${source.dx})`)
      // .attr("transform", d => `translate(${d.y}, ${d.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    const link = this.gLink.selectAll("path").data(links, d => d.target.id);

    const linkEnter = link
      .enter()
      .append("path")
      // .attr("d", d => {
      //   const o = { x: source.x, y: source.y };
      //   return d3.linkHorizontal({ source: o, target: o });
      // });
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x(d => d.y)
          .y(d => d.x)
      );

    link
      .merge(linkEnter)
      .transition(transition)
      .attr("d", this.diagonal);

    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", d => {
        const o = { x: source.x, y: source.y };
        return this.diagonal({ source: o, target: o });
      });

    this.root.eachBefore(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  async draw() {
    await this.setData(this.dataSetPath);
    this.root = this.tree(this.dataSet);

    this.root.descendants().forEach((d, i) => {
      d.id = i;
      if (d.children) {
        d._children = d.children;
      }
    });

    this.x0 = Infinity;
    this.x1 = -this.x0;

    this.root.each(d => {
      if (d.x > this.x1) this.x1 = d.x;
      if (d.x < this.x0) this.x0 = d.x;
    });

    this.bounds = d3
      .select("#wrapper")
      .append("svg")
      .attr("viewBox", [0, 0, this.width, this.x1 - this.x0 + this.root.dx * 2])
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr(
        "transform",
        `translate(${this.root.dy / 3}, ${this.root.dx - this.x0})`
      );

    this.gLink = this.bounds
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    this.gNode = this.bounds
      .append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3);

    this.update(this.root);
  }
}
