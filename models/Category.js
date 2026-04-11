const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
  {
    title: {
      en: { type: String, required: true },
      ru: { type: String, required: true },
      kg: { type: String, required: true },
    },
    desc: { type: String, default: null },
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
