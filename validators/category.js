const { check, param } = require("express-validator");
const mongoose = require("mongoose");

const addCategoryValidator = [
  check("title.en").notEmpty().withMessage("title.en is required"),
  check("title.ru").notEmpty().withMessage("title.ru is required"),
  check("title.kg").notEmpty().withMessage("title.kg is required"),
];

const idValidator = [
  param("id").custom(async (id) => {
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      throw "Invalid category id";
    }
  }),
];

module.exports = { addCategoryValidator, idValidator };
