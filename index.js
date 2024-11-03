const express = require("express");
const cors = require("cors");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express());

app.get("/", (req, res) => {
  res.send("EMarket Hub server is ready");
});




app.listen(port, () => {
  console.log(`EMarket server running PORT:${port}`);
});
