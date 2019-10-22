class Chart {
  constructor(opts) {
    this.dataSetPath = opts.dataSetPath;
    this.wrapper = opts.element;
    this.draw();
  }

  async setData(path) {
    this.dataSet = await d3.json("./filesystem_new.json").then(data => data);

    const calDepth = (node, depth) => {
      node.depth = depth;
      if (node.children) {
        node.children.forEach(child => calDepth(child, node.depth + 1));
      }
    };

    calDepth(this.dataSet, 0);
    console.log(this.dataSet);
    // this.dataSet = await d3.json("./filesystem_new.json").then(data => {
    //   console.log("data: ", data);
    //   const sum = json => {
    //     let val = 0;

    //     const sumAux = json => {
    //       val += json.value;
    //       if (json.children) {
    //         json.children.forEach(child => sumAux(child));
    //       }
    //     };
    //     sumAux(json);
    //     return val;
    //   };

    //   console.log("json sum: ");
    //   console.log(sum(data));
    //   console.log(sum(data) - 2518920);
    //   return data;
    // });

    // this.dataSet = await d3.text(path).then(data => {
    //   let lines = data.split("\n");
    //   let sizePathNameObject = lines
    //     .map(line => ({
    //       // size: +line.split("\t")[0],
    //       value: +line.split("\t")[0],
    //       path: line.split("\t")[1].split("/")
    //     }))
    //     .map(line => {
    //       let nameIndex = line.path.length - 1;
    //       return {
    //         ...line,
    //         name: line.path[nameIndex]
    //       };
    //     });

    //   console.log("sizePathNameObject");
    //   console.log(sizePathNameObject);

    //   let indices = [];
    //   let sum = sizePathNameObject.reduce((a, b, i) => {
    //     // console.log("i: ", i);
    //     indices.push(i);
    //     return a + b.value;
    //   }, 0);
    //   console.log("counts: ", d3.max(indices)); // works
    //   console.log(sum);

    //   // parsing given data for tree
    //   let arr = [];
    //   sizePathNameObject.forEach((file, i) => {
    //     // console.log("i in SizePath: ", i);
    //     let size = file.value;
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
    //         // leaf.size = size;
    //         leaf.value = size;
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

    console.log("maxDepth");
    console.log(maxDepth);
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
        // console.log("on change input");
        let inputValue = this.value;
        // console.log("inputValue", inputValue);
        sliderGenerator.silentValue(inputValue);
        // console.log(sliderGenerator.silentValue());
        that.depthThreshold = inputValue;
        const radioButtonVal = d3
          .selectAll(`input[name="layout"]:checked`)
          .property("value");
        // console.log("radioButtonVal: ", radioButtonVal);
        if (d3.select(`input[name="layout"]`).value == "horizontal") {
          that.updateHorizontal(that.rootHorizontal);
        } else {
          // that.rootRadial = d3
          //   .hierarchy(that.dataSet)
          //   .sum(d => d.value)
          //   .sort((a, b) => b.value - a.value);
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
        // console.log("slider value: ", val);
        sliderInput.attr("value", null);
        sliderInput.attr("text", val).property("value", val);
        that.depthThreshold = val;
        const radioButtonVal = d3
          .selectAll(`input[name="layout"]:checked`)
          .property("value");
        // console.log("radioButtonVal: ", radioButtonVal);

        if (radioButtonVal == "horizontal") {
          that.updateHorizontal(that.rootHorizontal);
        } else {
          that.updateRadial(that.rootRadial);
        }
      });

    this.slider = this.sliderDiv
      .append("svg")
      .attr("width", 300)
      .attr("height", 100)
      .style("display", "block")
      .append("g")
      .attr("transform", "translate(10, 30)")
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
      .text("Horizontal");

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
        that.updateHorizontal(that.rootHorizontal);
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
    this.sliderDiv = this.wrapper.append("div");

    this.height = 5000;
    this.width = window.innerWidth * 0.9;

    this.format = d3.format(",d");

    this.rootHorizontal = d3
      .hierarchy(this.dataSet)
      // .sum(d => d.size)
      .sum(d => d.value)
      .sort((a, b) => b.height - a.height || b.value - a.value);

    this.rootHorizontal.descendants().forEach((d, i) => {
      d.id = i;
      if (d.children) {
        d._children = d.children;
      }
    });

    console.log("this.rootHorizontal: ", this.rootHorizontal);
    this.rootHorizontal.value = this.rootHorizontal.data.value;
    console.log(
      "this.rootHorizontal after changing value: ",
      this.rootHorizontal
    );

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
      // console.log("sizeVals.length: ", sizeVals.length);
      // console.log("domain: ", d3.extent(sizeVals));
      sizeVals.sort((a, b) => a - b).pop();
      console.log(sizeVals);
      return sizeVals;
    })();

    // this.sizeColorScale = d3
    //   .scaleSequential(d3.interpolateYlGnBu)
    //   // .scaleSequential(d3.interpolateReds)
    //   .domain(d3.extent(sizeValues));

    this.sizeOpacityScale = d3
      .scaleLinear()
      .domain(d3.extent(sizeValues))
      .range([0.3, 0.45]);

    this.partition = d3
      .partition()
      .size([this.height, this.width])
      .padding(1);

    this.svg = this.wrapper
      .append("svg")
      .attr("viewBox", [0, 0, this.width, this.height])
      .style("font", "10px sans-serif");

    this.depthThreshold = 2;

    this.setRadioButton();
    this.setSlider();
    this.updateHorizontal(this.rootHorizontal);
  }

  updateHorizontal(source) {
    if (this.svg != null) {
      this.svg.remove();
    }
    this.height = 5000;
    this.width = window.innerWidth * 0.9;
    this.svg = this.wrapper
      .append("svg")
      .attr("viewBox", [0, 0, this.width, this.height])
      .style("font", "10px sans-serif");

    this.height = 5000;
    this.width = window.innerWidth * 0.9;

    this.partition = d3
      .partition()
      .size([this.height, this.width])
      .padding(1);

    this.rootHorizontal.descendants().forEach(d => {
      if (d.depth + 1 > this.depthThreshold) {
        d.children = null;
      }
    });

    // console.log("data");
    // console.log(source.descendants());
    // this.rootHorizontal.descendants().forEach((d, i) => {
    //   d.id = i;
    //   if (d.children) {
    //     d._children = d.children;
    //   }
    // });
    const duration = d3.event && d3.event.altKey ? 2500 : 250;

    // console.log("this.rootHorizontal in updateHorizontal 1");
    // console.log(this.rootHorizontal);
    this.partition(this.rootHorizontal);
    // console.log("this.rootHorizontal after calling this.partition");
    // console.log(this.rootHorizontal);

    // svg - manage with update..
    // this.svg.remove()

    const cell = this.svg
      .selectAll("g")
      // .data(this.rootHorizontal.descendants(), d => d.id);
      .data(this.rootHorizontal.descendants().reverse(), d => {
        // console.log("d in cell");
        // console.log(d);
        return d.id;
      });

    const cellEnter = cell
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.y0}, ${d.x0})`)
      .on("click", d => {
        d.children = d.children ? null : d._children;
        if (d.depth == this.depthThreshold) {
          this.depthThreshold = d.depth + 1;
        }

        this.sliderInput.property("value", this.depthThreshold);
        this.sliderGenerator.silentValue(this.depthThreshold);
        this.updateHorizontal(d);
      });

    const cellEnterRect = cellEnter
      .append("rect")
      .attr("width", d => d.y1 - d.y0)
      .attr("height", d => d.x1 - d.x0)
      .attr("stroke-width", 2)
      .attr("fill-opacity", d => this.sizeOpacityScale(d.value))
      .attr("fill", d => {
        if (!d.depth) {
          return "#ccc";
        } else {
          return "blue";
        }
      });
    // .attr("fill", "blue");

    const cellTextEnter = cellEnter
      .filter(d => d.x1 - d.x0 > 16)
      .append("text")
      .style("text-decoration", d => (d._children ? "underline" : "none"))
      .attr("x", 4)
      .attr("y", 13)
      .style("display", "block");

    cellTextEnter
      .append("tspan")
      .style("display", "block")
      .text(d => d.data.name);

    cellTextEnter
      .append("tspan")
      .attr("fill-opacity", 0.7)
      .style("display", "block")
      .text(d => `\n${this.format(d.value)}`);

    cellEnter.append("title").text(
      d =>
        `${d
          .ancestors()
          .map(d => d.data.name)
          .reverse()
          .join("/")}\n${this.format(d.value)}`
    );

    const cellUpdate = cell
      .merge(cellEnter)
      .transition()
      .duration(duration)
      .attr("transform", d => `translate(${d.y0}, ${d.x0})`);

    const cellExit = cell
      .exit()
      .transition()
      .duration(duration)
      .remove()
      .attr("transform", d => `translate(${source.y0}, ${source.x0})`)
      .attr("fill-opacity", 0);
  }

  updateRadial(source) {
    // this.svg.selectAll("g").remove();
    const that = this;
    this.svg.remove();
    // this.svg.selectAll("g").remove();
    this.svg = this.wrapper.append("svg");

    this.svg
      .style("max-width", "100%")
      .style("height", "auto")
      .style("font", "3px sans-serif")
      .style("margin", "5px");
    // .attr("viewBox", [0, 0, this.width, this.height]);

    this.radius = this.width / 2;

    function autoBox() {
      const { x, y, width, height } = this.getBBox();
      return [x, y, width, height];
    }

    this.arc = d3
      .arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(this.radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 1);

    this.radialPartition = d3.partition().size([2 * Math.PI, this.radius]);

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

    const duration = d3.event && d3.event.altKey ? 2500 : 250;

    this.radialPartition(this.rootRadial);

    const path = this.svg
      .append("g")
      .attr("fill-opacity", 0.6)
      .selectAll("path")
      .data(this.rootRadial.descendants().filter(d => d.depth));

    const pathEnter = path
      .enter()
      .append("path")
      .attr("fill", "blue")
      .attr("d", this.arc)
      .on("click", d => {
        d.children = d.children ? null : d._children;
        if (d.depth == this.depthThreshold) {
          this.depthThreshold = d.depth + 1;
        }

        this.sliderInput.property("value", this.depthThreshold);
        this.sliderGenerator.silentValue(this.depthThreshold);
        this.updateRadial(d);
      });

    const pathEnterTitle = pathEnter.append("title").text(
      d =>
        `${d
          .ancestors()
          .map(d => d.data.name)
          .reverse()
          .join("/")}\n${this.format(d.value)}`
    );

    const pathUpdate = path
      .merge(pathEnter)
      .transition()
      .duration(duration)
      .attr("d", this.arc);

    const pathExit = path
      .exit()
      .transition()
      .duration(duration)
      .remove()
      .attr("trasnform", d => `translate(${source.y}, ${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    const text = this.svg
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(
        this.rootRadial
          .descendants()
          .filter(d => d.depth && ((d.y0 + d.y1) / 2) * (d.x1 - d.x0) > 3)
      );

    const textEnter = text
      .enter()
      .append("text")
      .attr("transform", function(d) {
        console.log("d in radial text");
        console.dir(d);
        const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90})translate(${y},0)rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.1em")
      .text(d => d.data.name);

    const textUpdate = text
      .merge(textEnter)
      .transition()
      .duration(duration)
      .attr("transform", function(d) {
        console.log("d in radial text");
        console.dir(d);
        const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90})translate(${y},0)rotate(${x < 180 ? 0 : 180})`;
      });

    const textExit = text
      .exit()
      .transition()
      .duration(duration)
      .remove()
      .attr("transform", function(d) {
        console.log("d in radial text");
        console.dir(d);
        const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90})translate(${y},0)rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("fill-opacity", 0);

    this.svg.attr("viewBox", autoBox);
  }
}
