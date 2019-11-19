const express = require("express");
const cors = require("cors");
const xlsx = require("xlsx");

const app = express();
app.use(cors());

app.get("/data", (req, res) => {
  const workbook = xlsx.readFile("./2018_all_indicators.xlsx");
  console.log(workbook.SheetNames);

  const data = {};
  workbook.SheetNames.forEach(sheet => {
    data[sheet] = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);
  });

  console.log(Object.keys(data));

  res.json(data);
});

app.set("port", process.env.PORT || 4000);

const server = app.listen(app.get("port"), () => {
  console.log(`Express running -> PORT ${server.address().port}`);
});
