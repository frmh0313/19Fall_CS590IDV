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
          size: +line.split("\t")[0],
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

  setSlider() {
    let maxDepth = (() => {
      let depthVals = [];

      let getDepth = object => {
        depthVals.push(object.depth);
        if (object.children) {
          object.children.forEach(child => getDepth(child));
        }
      };

      getDepth(this.dataSet);
      return d3.max(depthVals);
    })();
    let sliderInput;
    let sliderGenerator;

    let that = this;
    this.sliderDiv = this.wrapper.append("div");

    this.sliderDiv.append("label").text("Graph depth slider");

    sliderInput = this.sliderDiv
      .append("input")
      .attr("id", "value-simple")
      .attr("type", "number")
      .style("display", "inline")
      .attr("value", this.depthThreshold)
      .attr("min", 1)
      .attr("max", maxDepth)
      .on("change", function() {
        console.log("on change input");
        let inputValue = this.value;
        sliderGenerator.silentValue(inputValue / 100);
        that.depthThreshold = inputValue;
        that.update(that.root, that.gNode, that.gLink);
      });

    sliderGenerator = d3
      .sliderBottom()
      .min(1)
      .max(maxDepth)
      .width(250)
      .step(1)
      .ticks(maxDepth)
      .default(this.depthThreshold)
      .handle(
        d3
          .symbol()
          .type(d3.symbolCircle)
          .size(300)
      )
      .fill("skyblue")
      .on("onchange", function(val) {
        console.log("slider value: ", val);
        sliderInput.attr("value", null);

        sliderInput.attr("text", val).property("value", val);
        that.depthThreshold = val;
        that.update(that.root, that.gNode, that.gLink);
      });

    this.slider = this.sliderDiv
      .append("svg")
      .attr("width", 300)
      .attr("height", 100)
      .style("display", "block")
      .append("g")
      .attr("transform", "translate(0, 30)")
      .call(sliderGenerator);

    this.sliderInput = sliderInput;
    this.sliderGenerator = sliderGenerator;
  }

  async draw() {
    await this.setData(this.dataSetPath);

    this.margin = { top: 10, right: 120, bottom: 10, left: 40 };
    this.width = window.innerWidth * 0.8;
    this.dx = 15;
    this.dy = this.width / 6;
    this.tree = d3.tree().nodeSize([this.dx, this.dy]);

    this.diagonal = d3
      .linkHorizontal()
      .x(d => d.y)
      .y(d => d.x);

    this.root = d3.hierarchy(this.dataSet);

    this.root.x0 = this.dy / 2;
    this.root.y0 = 0;
    this.root.descendants().forEach((d, i) => {
      d.id = i;
      if (d.children) {
        d._children = d.children;
      }
    });

    // this.wrapper = d3.select("#wrapper").style("overflow-x", "auto");

    this.svg = this.wrapper
      .append("svg")
      .attr("viewBox", [
        -this.margin.left,
        -this.margin.top,
        this.width,
        this.dx
      ])
      .attr(
        "transform",
        `translate(${-this.margin.left / 2}, ${this.margin.top})`
      )
      // .attr("transform", `translate(${-margin.left}, ${margin.top})`)
      .style("font", "13px sans-serif")
      .style("user-select", "none");

    this.gLink = this.svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    this.gNode = this.svg
      .append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    const sizeValues = (() => {
      let sizeVals = [];

      const getSize = object => {
        sizeVals.push(+object.size);
        if (object.children) {
          object.children.forEach(child => {
            getSize(child);
          });
        }
      };
      getSize(this.dataSet);
      // console.log("sizeVals.length: ", sizeVals.length);
      // console.log("domain: ", d3.extent(sizeVals));
      return sizeVals;
    })();

    this.sizeColorScale = d3
      .scaleSequential(d3.interpolateReds)
      .domain(d3.extent(sizeValues));

    this.depthThreshold = 2;

    this.update(this.root, this.gNode, this.gLink);

    this.setSlider();
    // return d3.select("#wrapper").node();
  }

  update(source, gNode, gLink) {
    this.root.descendants().forEach(d => {
      if (d.depth + 1 > this.depthThreshold) {
        d.children = null;
      }
    });

    const duration = d3.event && d3.event.altKey ? 2500 : 250;
    const nodes = this.root.descendants().reverse();
    console.log("nodes: ", nodes);
    const links = this.root.links();

    console.log("source");
    console.log(source);
    this.tree(this.root);

    console.log("root");
    console.log(this.root);
    let left = this.root;
    let right = this.root;
    this.root.eachBefore(node => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    console.log("left");
    console.log(left);
    console.log("right");
    console.log(right);

    this.height = right.x - left.x + this.margin.top + this.margin.bottom;

    const maxY = (() => {
      let yVals = [];
      const getYCoordinates = object => {
        yVals.push(object.y);
        if (object.children) {
          object.children.forEach(child => getYCoordinates(child));
        }
      };
      getYCoordinates(this.root);
      console.log("yVals.length: ", yVals.length);
      return d3.max(yVals);
    })();
    console.log("maxY");
    console.log(maxY);

    this.width = maxY + this.margin.right + this.margin.left + 100;
    console.log("width");
    console.log(this.width);

    const transition = this.svg
      .transition()
      .duration(duration)
      .attr("viewBox", [
        -this.margin.left,
        left.x - this.margin.top,
        this.width,
        this.height
      ])
      .attr("width", this.width)
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
        if (d.depth == this.depthThreshold) {
          this.depthThreshold = d.depth + 1;
        }

        this.sliderInput.property("value", this.depthThreshold);
        this.sliderGenerator.silentValue(this.depthThreshold);
        this.update(d, this.gNode, this.gLink);
      });

    nodeEnter
      .append("circle")
      .attr("r", 5)
      .attr("fill", d => this.sizeColorScale(d.data.size))
      // .attr("fill", d => (d._children ? "#555" : "#999"))
      .attr("stroke-width", 2)
      // .attr("stroke", "#555");
      .attr("stroke", "black");
    // .attr("stroke", d => (d._children ? "#555" : "#999"));

    nodeEnter
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", d => (d._children ? -6 : 6))
      .attr("text-anchor", d => (d._children ? "end" : "start"))
      .style("text-decoration", d => (d._children ? "underline" : "none"))
      .attr("fill", d => (d._children ? "#5577ee" : "black"))
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
        return this.diagonal({ source: o, target: o });
      });

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
      d.y0 = d.y;
    });
  }
}
