const mongoose = require("mongoose");

const langSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    desc: { type: String },
    blocks: { type: mongoose.Schema.Types.Mixed },  // prev: content
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    en: { type: langSchema, required: true },
    ru: { type: langSchema, required: true },
    kg: { type: langSchema, required: true },

    previewImage: { type: String },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("post", postSchema);
