const express = require("express");
const mysql = require("mysql");
const studentRoutes = require("./routes/student-routes");
const cors = require("cors");
const { connectToDatabase } = require("./db/config");

const app = express();
app.use(express.json());

app.use(cors());

connectToDatabase();

app.use("/table-data", studentRoutes);

app.listen(4000, () => {
  console.log("Running on PORT 4000");
});
