const { check, param } = require("express-validator");
const mongoose = require("mongoose");

const isValidObjectId = (value) => {
  if (value && !mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ObjectId");
  }
  return true;
};

const addPostValidator = [
  check("en.title").notEmpty().withMessage("en.title is required"),

  check("previewImage.public_id").notEmpty().withMessage("previewImage.public_id is required"),
  check("previewImage.url").notEmpty().withMessage("previewImage.url is required"),

  check("category").optional().custom(isValidObjectId).withMessage("Invalid category id"),

  check("tags")
    .optional()
    .isArray().withMessage("tags must be an array")
    .custom((arr) => {
      arr.forEach((id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new Error(`Invalid tag id: ${id}`);
      });
      return true;
    }),
];

const updatePostValidator = [
  check("category").optional().custom(isValidObjectId).withMessage("Invalid category id"),

  check("tags")
    .optional()
    .isArray().withMessage("tags must be an array")
    .custom((arr) => {
      arr.forEach((id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new Error(`Invalid tag id: ${id}`);
      });
      return true;
    }),
];

const idValidator = [
  param("id").custom((id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid post id");
    return true;
  }),
];

module.exports = { addPostValidator, updatePostValidator, idValidator };
