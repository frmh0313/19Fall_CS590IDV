class Chart {
  constructor(opts) {
    this.dataSetPath = opts.dataSetPath;
    this.wrapper = opts.element;
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

      this.fileTree = {};
      this.fileTree.children = [];

      sizePathNameObject.forEach(file => {
        let size = file.size;
        // prev: {[]}, curr: children arr

        file.path.reduce((prev, curr, i, arr) => {
          let newChild = {};
          if (!prev.some(dir => dir.name == curr)) {
            newChild.name = curr;
            prev.push(newChild);
          }
          if (i === arr.length - 1) {
            prev.find(dir => dir.name == curr).size = size;
            return prev;
          }

          let currElement = prev.find(dir => dir.name == curr);
          if (!currElement.hasOwnProperty("children")) {
            currElement.children = [];
          }
          return currElement.children;
        }, this.fileTree.children);
      });

      this.fileTree = this.fileTree.children[0];
      return sizePathNameObject;
    });
  }

  async draw() {
    await this.setData(this.dataSetPath);
  }
}
