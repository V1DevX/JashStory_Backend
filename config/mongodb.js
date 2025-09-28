const mongoose = require("mongoose");
const { connectionUrl } = require("./kyes");

const connectMongodb = async () => {
  try {
    await mongoose.connect(connectionUrl);
    console.log("✅ OK: Database connection successful");
  } catch (error) {
    console.log("❌ ERROR: Database connection failed");
    console.log(error.message);
  }
};

module.exports = connectMongodb;
