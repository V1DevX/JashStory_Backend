const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const questionLangSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: [optionSchema],
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["single", "multiple", "open"],
      required: true,
    },
    en: { type: questionLangSchema, required: true },
    ru: { type: questionLangSchema, required: true },
    kg: { type: questionLangSchema, required: true },
  },
  { _id: false }
);

const testSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "post" }, // общий ID с Post
    questions: { type: [questionSchema], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("test", testSchema);
