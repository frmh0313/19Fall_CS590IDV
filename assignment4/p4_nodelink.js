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
        const radioButtonVal = d3
          .selectAll(`input[name="layout"]:checked`)
          .property("value");
        console.log("radioButtonVal: ", radioButtonVal);
        if (d3.select(`input[name="layout"]`).value == "horizontal") {
          that.updateHorizontal(that.root);
        } else {
          that.width =
            window.innerWidth *
            0.8 *
            (1 + (this.depthThreshold - 1) / this.depthThreshold);
          that.height = that.width;
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
        const radioButtonVal = d3
          .selectAll(`input[name="layout"]:checked`)
          .property("value");
        console.log("radioButtonVal: ", radioButtonVal);

        if (radioButtonVal == "horizontal") {
          that.updateHorizontal(that.root);
        } else {
          that.width =
            window.innerWidth *
            0.8 *
            (1 + (this.depthThreshold - 1) / this.depthThreshold);
          that.height = that.width;
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
    this.radioButtonDiv = this.wrapper.append("div");

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
        that.width = window.innerWidth * 0.6;
        that.height = that.width;
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
    // this.root.x0 = this.dy / 2;
    // console.log("this.root.x0: this.dy/2");
    // console.log("this.root.x0: ", this.root.x0);
    // console.log("this.dy: ", this.dy);
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
      // .scaleSequential(d3.interpolateYlGnBu)
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
      // this.gLink = this.svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    this.gNode = this.g
      // this.gNode = this.svg
      .append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    this.depthThreshold = 2;

    this.updateHorizontal(this.root);
    // this.updateRadialNew(this.root);

    this.setSlider();

    this.setRadioButton();
  }

  updateHorizontal(source) {
    // this.dx = 15;
    // this.dy = this.width / 6;
    this.horizontalTree = d3.tree().nodeSize([this.dx, this.dy]);
    // this.root = null;
    // this.root = d3.hierarchy(this.dataSet);
    // this.root.y0 = 0;

    // this.root.descendants().forEach((d, i) => {
    //   d.id = i;
    //   if (d.children) {
    //     d._children = d.children;
    //   }
    // });

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
    // console.log("nodes: ", nodes);
    const links = this.root.links();

    // console.log("source");
    // console.log(source);

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
      .attr("fill", d => this.sizeColorScale(d.data.size))
      // .attr("fill", d => (d._children ? "#555" : "#999"))
      .attr("stroke-width", 2)
      // .attr("stroke", "#555");
      .attr("stroke", "black");
    // .attr("stroke", d => (d._children ? "#555" : "#999"));

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
    console.log("this.width: ", this.width);
    this.radius = this.width / 2;
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

    // const maxCoordinate = (() => {
    //   let vals = [];
    //   const getCoordinateValues = object => {
    //     vals.push(object.x);
    //     vals.push(object.y);
    //     if (object.children) {
    //       object.children.forEach(child => getCoordinateValues(child));
    //     }
    //   };
    //   getCoordinateValues(this.rootRadial);
    //   console.log("yVals.length: ", vals.length);
    //   return d3.max(vals);
    // })();
    // console.log("coordinates max");
    // console.log(maxCoordinate);

    // this.width = maxCoordinate + this.margin.right + this.margin.left + 100;
    // console.log("radial width: ", this.width);

    // let transition = d3
    //   .transition()
    //   .duration(duration)
    //   .ease(d3.easeLinear)
    //   .on("end", () => {
    //     console.log("box in end");
    //     const box = this.g.node().getBBox();
    //     console.log(box);
    //     this.svg
    //       // .trasition(transition)
    //       // .duration(1000)
    //       .attr("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
    //   });

    // const box = this.g.node().getBBox();

    // let transition = this.svg
    //   .transition()
    //   .duration(duration)
    //   .attr("width", box.width)
    //   .attr("height", box.height)
    //   .attr("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
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
      .attr("fill", d => this.sizeColorScale(d.data.size))
      .attr("stroke-width", 2)
      .attr("stroke", "black");

    const nodeEnterText = nodeEnter
      .append("text")
      // .attr("dy", "0.2em")
      .attr("dy", "0.5em")
      // .attr("x", d => (d.x < Math.PI === !d.children ? 10 : -2))
      .attr("x", d => (d.x < Math.PI ? 10 : 5))
      .attr("transform", d => (d.x >= Math.PI ? "rotate(180)" : null))
      .attr("text-anchor", d => (d.x >= Math.PI ? "rotate(180)" : null))
      .attr("fill", d => (d._children ? "#5577ee" : "black"))
      .text(d => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke", "white");

    // let transition = this.svg
    let transition = this.svg
      .transition()
      .duration(duration)
      .attr("viewBox", [
        (-this.width * 1.2) / 2,
        (-this.height * 1.2) / 2,
        this.width * 1.2,
        this.height * 1.2
      ])
      // .attr("viewBox", [
      //   -this.g.node().getBBox().width / 2,
      //   -this.g.node().getBBox().height / 2,
      //   this.g.node().getBBox().width * 1.2,
      //   this.g.node().getBBox().height * 1.2
      // ])
      .style("font", "10px sans-serif")
      .attr("width", this.width)
      .attr("height", this.height)
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
      if (!d.children) {
        d.children = d._chilrden;
        this.width = d3.max([
          window.innerWidth *
            0.8 *
            (1 + (this.depthThreshold - 1) / this.depthThreshold),
          this.g.node().getBBox().width
        ]);

        this.height = d3.max([
          window.innerHeight *
            0.8 *
            (1 + (this.depthThreshold - 1) / this.depthThreshold),
          this.g.node().getBBox().height
        ]);
      }

      d.children = d.children ? null : d._children;
      if (d.depth == this.depthThreshold) {
        this.depthThreshold = d.depth + 1;
        // this.width = this.g.node().getBBox().width;
        // this.width = this.width * (this.depthThreshold / 3);
      }
      // if (this.depthThreshold < maxDepth) {
      //   this.width = this.width / (1 + (d.depth - 1) / 3);
      // }

      // this.width = this.g.node().getBBox().width * 1.2;
      this.sliderInput.property("value", this.depthThreshold);
      this.sliderGenerator.silentValue(this.depthThreshold);
      this.updateRadial(d);
    });
    const link = this.gLink.selectAll("path").data(links, d => d.target.id);

    // link.join("path").attr(
    //   "d",
    //   d3
    //     .linkRadial()
    //     .angle(d => d.x)
    //     .radius(d => d.y)
    // );

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

    // const linkExit = link
    // .exit()
    // .transition(transition)
    // .remove();
    // .attr("d", d => {
    // const o = { x: source.x, y: source.y };
    // return this.diagonalRadial({ source: o, target: o });
    // });

    // this.root.eachBefore(d => {
    this.rootRadial.eachBefore(d => {
      d.y0 = d.y;
      d.x0 = d.x;
      // d.y0 = d.y;
    });
  }
  /*
  updateRadial2(source) {
    this.gLink.selectAll("g").remove();
    this.gNode.selectAll("g").remove();

    const that = this;
    this.width = window.innerWidth * 0.7;
    this.svg
      .transition()
      .duration(0)
      .attr("width", this.width)
      .attr("height", this.width)
      .style("width", "100%")
      .style("height", "auto")
      .style("box-sizing", "border-box")
      .style("font", "12px sans-serif");

    this.radialTree = data =>
      d3
        .tree()
        .size([2 * Math.PI, (this.width * 2) / 3])
        .separation((a, b) => (a.parent == b.parent ? 1 : 3) / a.depth)(
        d3.hierarchy(data)
      );

    const newData = (animate = true) => {
      let root = this.radialTree(this.dataSet);
      let links_data = root.links();
      let links = this.gLink
        .selectAll("path")
        .data(links_data, d => d.source.data.name + "_" + d.target.data.name);

      links.exit().remove();

      let newLinks = links
        .enter()
        .append("path")
        .attr(
          "d",
          d3
            .linkRadial()
            .angle(d => d.x)
            .radius(0.1)
        );

      let t = d3
        .transition()
        .duration(animate ? 400 : 0)
        .ease(d3.easeLinear)
        .on("end", () => {
          console.log("box in end");
          const box = this.svg.node().getBBox();
          // const box = this.g.node().getBBox();
          console.log(box);
          this.svg
            // .trasition()
            // .duration(1000)
            .attr("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
        });

      let allLinks = that.gLink.selectAll("path");

      allLinks.transition(t).attr(
        "d",
        d3
          .linkRadial()
          .angle(d => d.x)
          .radius(d => d.y)
      );

      let nodes_data = root.descendants().reverse();

      let nodes = that.gNode.selectAll("g").data(nodes_data, d => {
        if (d.parent) {
          return d.parent.data.name + d.data.name;
        }
        return d.data.name;
      });

      nodes.exit().remove();

      let newNodes = nodes.enter().append("g");

      let allNodes = animate
        ? that.gNode.selectAll("g").transition(t)
        : that.gNode.selectAll("g");

      allNodes.attr(
        "transform",
        d => `rotate(${(d.x * 180) / Math.PI - 90})translate(${d.y},0)`
      );

      newNodes
        .append("circle")
        .attr("r", 5)
        .attr("fill", d => this.sizeColorScale(d.data.size))
        .on("click", d => {
          d.children = d.children ? null : d._children;
          if (d.depth == that.depthThreshold) {
            that.depthThreshold = d.depth + 1;
          }
          that.updateRadial2(d);
        });

      newNodes
        .append("text")
        .attr("dy", "0.31em")
        .text(d => d.data.name)
        .clone(true)
        .lower()
        .attr("stroke", "white");

      that.gNode
        .selectAll("g text")
        .attr("x", d => (d.x < Math.PI === !d.children ? 6 : -6))
        .attr("text-anchor", d =>
          d.x < Math.PI === !d.children ? "start" : "end"
        )
        .attr("transform", d => (d.x >= Math.PI ? "rotate(180)" : null));

      const box = that.g.node().getBBox();
      console.log("box: ", box);
      // this.svg
      //   .remove()
      //   .attr("width", box.width)
      //   .attr("height")
      //   .attr("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
    };
    newData(true);
  }

  updateRadialNew(source) {
    this.gLink.selectAll("g").remove();
    this.gNode.selectAll("g").remove();

    // this.width = window.innerWidth * 0.8;
    // this.height = this.width;
    this.width = 932;
    this.height = this.width;
    // this.root.y0 = 100;
    // this.root.x = 100;
    // this.root = null;
    const root = d3.hierarchy(this.dataSet);
    // this.root.x0 = this.height / 2;
    // this.root.y0 = 0;
    console.log("this.root in radial");
    console.log(this.root);

    this.svg
      .transition()
      .duration(1000)
      .attr("width", this.width)
      .style("max-width", "100%")
      // .attr("viewBox", [
      //   this.width / 2,
      //   this.height / 2,
      //   this.width,
      //   this.height
      // ])
      .attr("height", this.height)
      .style("height", "auto");

    this.radialTree = d3
      .tree()
      .size([2 * Math.PI, 600])
      // .size([2 * Math.PI, this.width / 3 - 80])
      .separation((a, b) => (a.parent == b.parent ? 1 : 10) / a.depth);

    this.diagonalRadial = d3
      .linkRadial()
      .angle(d => d.x)
      // .radius(0.1);
      .radius(d => d.y);

    // this.root.descendants().forEach(d => {
    root.descendants().forEach(d => {
      if (d.depth + 1 > this.depthThreshold) {
        d.children = null;
      }
    });

    const duration = d3.event && d3.event.altKey ? 2500 : 250;
    const nodes = root.descendants().reverse();
    const links = root.links();
    // const nodes = this.root.descendants().reverse();
    // const links = this.root.links();

    const transition = d3
      .transition()
      .duration(duration)
      .attr("viewBox", [
        -this.margin.left,
        -this.margin.top,
        this.width,
        this.height
      ])
      .ease(d3.easeLinear)
      .tween(
        "resize",
        window.ResizeObserver ? null : () => () => this.svg.dispatch("toggle")
      );
    // .on("end", function() {
    //   const box = this.gNode.node().getBBox();
    //   this.svg
    //     .transition()
    //     .duration(1000)
    //     .attr("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
    // });
    nodes.forEach(d => {
      d.y = d.depth * 80;
    });
    this.radialTree(root);

    const node = this.gNode.selectAll("g").data(nodes, d => d.id);

    const nodeEnter = node
      .enter()
      .append("g")
      .attr(
        "transform",
        d => `rotate(${(d.x * 180) / Math.PI - 90})translate(${d.y},0)`
      )
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", d => {
        d.children = d.children ? null : d._children;
        if (d.depth == this.depthThreshold) {
          this.depthThreshold = d.depth + 1;
        }

        // slider to be added
        this.sliderInput.property("value", this.depthThreshold);
        this.sliderGenerator.silentValue(this.depthThreshold);
        this.updateRadialNew(d);
      });

    nodeEnter
      .append("circle")
      .attr("r", 5)
      .attr("fill", d => this.sizeColorScale(d.data.size))
      .attr("stroke-width", 2)
      .attr("stroke", "black");

    nodeEnter
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", d => (d.x < Math.PI === !d.children ? 6 : -6))
      .attr("text-anchor", d => (d.x >= Math.PI ? "rotate(180)" : null))
      .attr("transform", d => (d.x >= Math.PI ? "rotate(180)" : null))
      .attr("fill", d => (d._children ? "#5577ee" : "black"))
      .text(d => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke", "white");

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
      .remove();

    const link = this.gLink.selectAll("path").data(links, d => d.target.id);

    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", d => {
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
        const o = { x: source.x, y: source.y };
        return this.diagonalRadial({ source: o, target: o });
      });

    // this.root.eachBefore(d => {
    root.eachBefore(d => {
      // d.yo = d.y
      // d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  /*updateRadial(source, gNode, gLink) {
    // gNode
    //   .transition()
    //   .duration(1000)
    //   .selectAll("g")
    //   .remove();

    // gLink
    //   .transition()
    //   .duration(1000)
    //   .selectAll("path")
    //   .remove();

    this.radialTree = d3
      .tree()
      .size([2 * Math.PI, this.width / 2])
      .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

    this.diagonalRadial = d3
      .linkRadial()
      .angle(d => d.x)
      .radius(d => d.y);

    this.root.descendants().forEach(d => {
      if (d.depth + 1 > this.depthThreshold) {
        d.children = null;
      }
    });

    const duration = d3.event && d3.event.altKey ? 2500 : 250;
    const nodes = this.root.descendants().reverse();
    const links = this.root.links();

    nodes.forEach(d => (d.y = d.depth * 80));
    this.radialTree(this.root);

    this.nodeEnterText.attr("text-anchor", d => "start");
    // .attr("transform", d => {
    //   if (!d.x) {
    //     return "rotate(0)"
    //   } else {
    //     return d.x < 180? "transoate(0)" : "rotate(180)"
    //   }
    // })

    this.nodeUpdate = this.gNode
      .selectAll("g")
      .data(nodes, d => d.id)
      .merge(this.nodeEnter)
      .transition()
      .duration(duration)
      .attr("transform", d => `rotate(${d.x - 90})translate(${d.y})`);

    this.nodeExit
      .transition(duration)
      .remove()
      .attr("transform", d => `translate(${source.y}, ${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    const link = this.gLink.selectAll("path").data(links, d => d.target.id);

    this.linkEnter.attr("d", d => {
      const o = { x: source.x, y: source.y };
      return this.diagonalRadial({ source: o, target: o });
    });

    this.linkUpdate = link
      .merge(this.linkEnter)
      .transition()
      .duration(duration)
      .attr("d", this.diagonalRadial);

    this.linkExit = link
      .exit()
      .transition()
      .duration(duration)
      .attr("d", d => {
        const o = { x: source.x, y: source.y };
        return this.diagonalRadial({ source: o, target: o });
      });

    nodes.forEach(d => {
      d.x0 = d.x;
      d.yo = d.y;
    });

    // const node = gNode.selectAll("g").data(nodes, d => d.id)

    // const nodeEnter = node.enter().append("g")
    // .attr("transform", d => `translate(${source.y}, ${source.x})`)
    // .attr("fill-opacity", 0)
    // .attr("stroke-opacity", 0)
    // .on("click", d => {
    //   d.children = d.children ?  null : d._children
    //   if (d.depth == this.depthThreshold) {
    //     this.depthThreshold = d.depth + 1;
    //   }

    //   this.sliderInput.property("value", this.depthThreshold)
    //   .this.sliderGenerator.silentValue(this.depthThreshold)
    //   this.updateRadial(d, this.gNode, this.gLink)
    // })

    // nodeEnter.append("circle")
    // .attr("r", 5)
    // .attr("fill", d => this.sizeColorScale(d.data.size))
    // .attr("stroke-width", 2)
    // .attr("stroke", "black")

    // nodeEnter.append("text")
  }*/
}
