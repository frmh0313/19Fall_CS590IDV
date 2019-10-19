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

  async draw() {
    await this.setData(this.dataSetPath);

    const that = this;
    let margin = { top: 10, right: 120, bottom: 10, left: 40 };
    let width = window.innerWidth * 0.8;
    let dx = 15;
    let dy = width / 6;
    let tree = d3.tree().nodeSize([dx, dy]);

    let diagonal = d3
      .linkHorizontal()
      .x(d => d.y)
      .y(d => d.x);

    let root = d3.hierarchy(this.dataSet);

    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
      d.id = i;
      if (d.children) {
        d._children = d.children;
      }

      if (d.depth > 2) {
        d.children = null;
      }
    });

    // this.wrapper = d3.select("#wrapper").style("overflow-y", "auto");

    const svg = this.wrapper
      .append("svg")
      .attr("viewBox", [-margin.left, -margin.top, width, dx])
      .attr("transform", `translate(${-margin.left}, ${margin.top})`)
      .style("font", "13px sans-serif")
      .style("user-select", "none");

    const gLink = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    const gNode = svg
      .append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    function update(source) {
      const duration = d3.event && d3.event.altKey ? 2500 : 250;
      const nodes = root.descendants().reverse();
      const links = root.links();

      console.log("source");
      console.log(source);
      tree(root);

      console.log("root");
      console.log(root);
      let left = root;
      let right = root;
      root.eachBefore(node => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });

      console.log("left");
      console.log(left);
      console.log("right");
      console.log(right);

      const height = right.x - left.x + margin.top + margin.bottom;

      const maxY = (() => {
        let yVals = [];
        function getYCoordinates(object) {
          yVals.push(object.y);
          if (object.children) {
            object.children.forEach(child => getYCoordinates(child));
          }
        }
        getYCoordinates(root);
        return d3.max(yVals);
      })();
      console.log("maxY");
      console.log(maxY);

      width = maxY + margin.right + margin.left;
      console.log("width");
      console.log(width);
      const transition = svg
        .transition()
        .duration(duration)
        .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
        .attr("width", width)
        // .attr("height", height)
        .tween(
          "resize",
          window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
        );

      const node = gNode.selectAll("g").data(nodes, d => d.id);

      console.log("node");
      console.log(node);
      const nodeEnter = node
        .enter()
        .append("g")
        .attr("transform", d => `translate(${source.y}, ${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", d => {
          d.children = d.children ? null : d._children;
          update(d);
        });

      nodeEnter
        .append("circle")
        .attr("r", 2.5)
        .attr("fill", d => (d._children ? "#555" : "#999"))
        .attr("stroke-width", 10);

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
        .attr("transform", d => `translate(${d.y}, ${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      const nodeExit = node
        .exit()
        .transition(transition)
        .remove()
        .attr("transform", d => `translate(${source.y}, ${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      const link = gLink.selectAll("path").data(links, d => d.target.id);

      const linkEnter = link
        .enter()
        .append("path")
        .attr("d", d => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        });

      link
        .merge(linkEnter)
        .transition(transition)
        .attr("d", diagonal);

      link
        .exit()
        .transition(transition)
        .remove()
        .attr("d", d => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        });

      root.eachBefore(d => {
        d.y0 = d.y;
      });
    }
    update(root);

    // return d3.select("#wrapper").node();
  }
}
