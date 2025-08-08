const mongoose = require("mongoose");

// const postSchema = mongoose.Schema(
//   {
//     title: {
//       en: { type: String, required: true },
//       ru: { type: String, required: true },
//       // kg: { type: String, required: true },
//     },
//     desc: {
//       en: String,
//       ru: String,
//       // kg: String,
//     },
//     content: [{type: mongoose.Schema.Types.Mixed, required: true}],
//     // category: {
//     //   type: mongoose.Types.ObjectId,
//     //   ref: "category",
//     //   required: true,
//     // },
    
//     // Rating 
//     // 
//     updatedBy: { type: mongoose.Types.ObjectId, ref: "user", required: true },
//   },
//   { timestamps: true }
// );


const langSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    desc: { type: String },
    content: { type: mongoose.Schema.Types.Mixed }, 
    // Можно хранить JSON от Editor.js или HTML
  },
  { _id: false } // Не создаем отдельный _id для вложенного объекта
);

const postSchema = new mongoose.Schema(
  {
    ru: { type: langSchema, required: true },
    en: { type: langSchema, required: true },
    kg: { type: langSchema, required: true },

    previewImage: { type: String }, // URL на изображение превью

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("post", postSchema);
