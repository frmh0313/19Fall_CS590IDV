class Chart {
  constructor(opts) {
    this.dataSetPath = opts.dataSetPath;
    this.wrapper = opts.element;
    this.draw();
  }

  async setData(path) {
    this.dataSet = await d3.json("./filesystem_new.json");

    const calDepth = (node, depth) => {
      node.depth = depth;
      if (node.children) {
        node.children.forEach(child => calDepth(child, node.depth + 1));
      }
    };

    calDepth(this.dataSet, 0);
    // this.dataSet = await d3.text(path).then(data => {
    //   let lines = data.split("\n");
    //   let sizePathNameObject = lines
    //     .map(line => ({
    //       size: +line.split("\t")[0],
    //       path: line.split("\t")[1].split("/")
    //     }))
    //     .map(line => {
    //       let nameIndex = line.path.length - 1;
    //       return {
    //         ...line,
    //         name: line.path[nameIndex]
    //       };
    //     });

    //   // parsing given data for tree
    //   let arr = [];
    //   sizePathNameObject.forEach(file => {
    //     let size = file.size;
    //     // prev: {[]}, curr: children arr

    //     file.path.reduce((prev, curr, i, arr) => {
    //       let newChild = {};
    //       if (!prev.some(dir => dir.name == curr)) {
    //         newChild.name = curr;
    //         newChild.depth = i;
    //         prev.push(newChild);
    //       }
    //       if (i === arr.length - 1) {
    //         let leaf = prev.find(dir => dir.name == curr);
    //         leaf.size = size;
    //         leaf.depth = i;
    //         return leaf;
    //       }

    //       let currElement = prev.find(dir => dir.name == curr);
    //       if (!currElement.hasOwnProperty("children")) {
    //         currElement.children = [];
    //       }
    //       return currElement.children;
    //     }, arr);
    //   });

    //   return arr[0];
    // });
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
        sliderGenerator.silentValue(inputValue);
        that.depthThreshold = inputValue;
        const radioButtonVal = d3
          .selectAll(`input[name="layout"]:checked`)
          .property("value");
        console.log("radioButtonVal: ", radioButtonVal);
        if (radioButtonVal == "horizontal") {
          that.updateHorizontal(that.root);
        } else {
          that.width = that.height;
          that.updateRadial(that.rootRadial);
        }
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
        let radioButtonVal = d3
          .selectAll(`input[name="layout"]:checked`)
          .property("value");
        console.log("radioButtonVal: ", radioButtonVal);

        if (radioButtonVal == "horizontal") {
          that.updateHorizontal(that.root);
        } else {
          // that.width = that.height;
          that.updateRadial(that.rootRadial);
        }
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

  setRadioButton() {
    const that = this;

    this.radioButtonDiv
      .append("input")
      .attr("type", "radio")
      .attr("name", "layout")
      .attr("id", "horizontal")
      .attr("checked", true)
      .attr("value", "horizontal");

    this.radioButtonDiv
      .append("label")
      .attr("for", "horizontal")
      .text("Horizontal Layout");

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
      if (this.value == "horizontal") {
        console.log("updateHorizontal");
        that.gLink.selectAll("path").remove();
        that.gNode.selectAll("g").remove();
        that.updateHorizontal(that.root);
      } else {
        console.log("updateRadial");
        that.rootRadial = d3.hierarchy(that.dataSet);
        that.rootRadial.descendants().forEach((d, i) => {
          d.id = i;
          if (d.children) {
            d._children = d.children;
          }
        });
        // that.height = that.width;
        that.height = 1200;
        that.width = that.height;
        that.depthThreshold = 2;
        that.gLink.selectAll("path").remove();
        that.gNode.selectAll("g").remove();
        that.updateRadial(that.rootRadial);
      }
    });
  }

  async draw() {
    await this.setData(this.dataSetPath);

    this.margin = { top: 10, right: 120, bottom: 10, left: 40 };
    this.width = window.innerWidth * 0.8;

    this.root = d3.hierarchy(this.dataSet);

    this.root.y0 = 0;

    this.root.descendants().forEach((d, i) => {
      d.id = i;
      if (d.children) {
        d._children = d.children;
      }
    });

    const sizeValues = (() => {
      let sizeVals = [];

      const getSize = object => {
        sizeVals.push(+object.value);
        if (object.children) {
          object.children.forEach(child => {
            getSize(child);
          });
        }
      };
      getSize(this.dataSet);
      return sizeVals;
    })();

    this.sizeColorScale = d3
      .scaleSequential(d3.interpolateReds)
      .domain(d3.extent(sizeValues));

    this.dx = 15;
    this.dy = this.width / 6;

    this.radius = this.width / 1.8;
    this.horizontalTree = d3.tree().nodeSize([this.dx, this.dy]);

    this.diagonalHorizontal = d3
      .linkHorizontal()
      .x(d => d.y)
      .y(d => d.x);
    this.radioButtonDiv = this.wrapper.append("div");
    this.sliderDiv = this.wrapper.append("div");

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
      .style("font", "13px sans-serif")
      .style("user-select", "none");

    this.g = this.svg.append("g");
    this.gLink = this.g
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    this.gNode = this.g
      .append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    this.depthThreshold = 2;

    this.updateHorizontal(this.root);

    this.setSlider();

    this.setRadioButton();
  }

  updateHorizontal(source) {
    this.horizontalTree = d3.tree().nodeSize([this.dx, this.dy]);

    this.diagonalHorizontal = d3
      .linkHorizontal()
      .x(d => d.y)
      .y(d => d.x);

    this.root.descendants().forEach(d => {
      if (d.depth + 1 > this.depthThreshold) {
        d.children = null;
      }
    });

    const duration = d3.event && d3.event.altKey ? 2500 : 250;
    const nodes = this.root.descendants().reverse();
    const links = this.root.links();

    this.horizontalTree(this.root);

    let left = this.root;
    let right = this.root;
    this.root.eachBefore(node => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

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
      return d3.max(yVals);
    })();

    this.width = maxY + this.margin.right + this.margin.left + 100;

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

    const node = this.gNode.selectAll("g").data(nodes, d => d.id);

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
        this.updateHorizontal(d, this.gNode, this.gLink);
      });

    const nodeEnterCircle = nodeEnter
      .append("circle")
      .attr("r", 5)
      .attr("fill", d => this.sizeColorScale(d.data.value))
      .attr("stroke-width", 2)
      .attr("stroke", "black");

    const nodeEnterText = nodeEnter
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

    const link = this.gLink.selectAll("path").data(links, d => d.target.id);

    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", d => {
        const o = { x: source.x, y: source.y };
        return this.diagonalHorizontal({ source: o, target: o });
      });

    const linkUpdate = link
      .merge(linkEnter)
      .transition(transition)
      .attr("d", this.diagonalHorizontal);

    const linkExit = link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", d => {
        const o = { x: source.x, y: source.y };
        return this.diagonalHorizontal({ source: o, target: o });
      });

    this.root.eachBefore(d => {
      d.y0 = d.y;
    });
  }

  updateRadial(source) {
    // this.width = this.height = 800;
    // this.gLink.selectAll("path").remove();
    // this.gNode.selectAll("g").remove();
    console.log("this.width: ", this.width);
    this.radius = this.width / 3;
    console.log("this.height: ", this.height);

    this.radialTree = d3
      .tree()
      .size([2 * Math.PI, this.radius])
      .separation((a, b) => (a.parent == b.parent ? 1 : 3) / a.depth);

    // this.width = 932;

    // this.rootRadial = d3.hierarchy(this.dataSet);

    this.rootRadial.descendants().forEach((d, i) => {
      d.id = i;
      if (d.children) {
        d._children = d.children;
      }
    });

    this.rootRadial.descendants().forEach(d => {
      if (d.depth + 1 > this.depthThreshold) {
        d.children = null;
      }
    });

    this.diagonalRadial = d3
      .linkRadial()
      .angle(d => d.x)
      .radius(d => d.y);
    // .radius(0.1);

    const duration = d3.event && d3.event.altKey ? 2500 : 250;

    const nodes = this.rootRadial.descendants().reverse();
    const links = this.rootRadial.links();

    this.radialTree(this.rootRadial);

    const node = this.gNode.selectAll("g").data(nodes, d => d.id);

    const nodeEnter = node
      .enter()
      .append("g")
      .attr(
        "transform",
        d => `rotate(${(d.x * 180) / Math.PI - 90})
        translate(${d.y},0)`
      )
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    const nodeEnterCircle = nodeEnter
      .append("circle")
      .attr("r", 2.5)
      .attr("fill", d => this.sizeColorScale(d.data.value))
      .attr("stroke-width", 2)
      .attr("stroke", "black");

    const nodeEnterText = nodeEnter
      .append("text")
      .attr("dy", "0.2em")
      .attr("x", d => (d.x < Math.PI ? 10 : 5))
      .attr("transform", d => (d.x >= Math.PI ? "rotate(180)" : null))
      .attr("text-anchor", d => (d.x >= Math.PI ? "rotate(180)" : null))
      .attr("fill", d => (d._children ? "#5577ee" : "black"))
      .text(d => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke", "white");

    let transition = this.svg
      .transition()
      .duration(duration)
      .attr("viewBox", [
        -this.width / 2 - 50,
        -this.height / 2,
        this.width,
        this.height
      ])
      .attr("width", this.width)
      .attr("height", this.height)
      .style("font", "12px sans-serif")
      .tween(
        "resize",
        window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
      );
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr(
        "transform",
        d => `rotate(${(d.x * 180) / Math.PI - 90})translate(${d.y},0)`
      )
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    const nodeExit = node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", d => `translate(${source.y}, ${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    nodeEnter.on("click", d => {
      d.children = d.children ? null : d._children; //??
      if (d.depth == this.depthThreshold) {
        this.depthThreshold = d.depth + 1;
      }

      this.sliderInput.property("value", this.depthThreshold);
      this.sliderGenerator.silentValue(this.depthThreshold);
      this.updateRadial(d);
    });
    const link = this.gLink.selectAll("path").data(links, d => d.target.id);

    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", d => {
        // const o = { x: d.x, y: d.y };
        const o = { x: source.x, y: source.y };
        return this.diagonalRadial({ source: o, target: o });
      });

    const linkUpdate = link
      .merge(linkEnter)
      .transition(transition)
      .attr("d", this.diagonalRadial);

    const linkExit = link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", d => {
        // console.log("exit called");
        const o = { x: source.x, y: source.y };
        return this.diagonalRadial({ source: o, target: o });
      });

    this.rootRadial.eachBefore(d => {
      d.y0 = d.y;
      d.x0 = d.x;
    });
  }
}
