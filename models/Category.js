const mongoose = require("mongoose");
const { map } = require("../app");

const categorySchema = mongoose.Schema(
  {
    title: {
      en: { type: String, required: true },
      ru: { type: String, required: true },
      kg: { type: String, required: true }
    },
    desc: String,
    updatedBy: { type: mongoose.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

const Category = mongoose.model("category", categorySchema);
module.exports = Category;
