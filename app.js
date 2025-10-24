const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
dotenv.config();
const connectMongodb = require("./config/mongodb")
// const { authRoute, categoryRoute, fileRoute, postRoute } = require("./routes");
const { authRoute, categoryRoute, postRoute, fileRoute, testRoute } = require("./routes");
const { errorHandler } = require("./middlewares");
const notfound = require("./controllers/notfound");
const { nodeEnv } = require("./config/kyes");

// init app
const app = express();

// connect database
connectMongodb();

// third-party middleware
app.use(cors({
  origin: nodeEnv ? 'https://jashstory.com' : 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));
/// TODO: when it's PROD save data in DB or in LogStream file
app.use(morgan("dev", {
  skip: function (req, res) {
    return res.statusCode === 304;
  }
}));

// route section
app.use("/api/auth", authRoute);
app.use("/api/category", categoryRoute);
app.use("/api/posts", postRoute);
app.use("/api/tests", testRoute);

app.use("/api/media", fileRoute);

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ code: 200, status: true, message: "Server is running." });
});

// not found route
app.use("*", notfound);

// error handling middleware
app.use(errorHandler);

module.exports = app;
