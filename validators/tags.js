const { check, param } = require("express-validator");
const mongoose = require("mongoose");

const VALID_TYPES = ["person", "event", "place", "era", "dynasty", "concept"];

const addTagValidator = [
  check("type")
    .notEmpty().withMessage("type is required")
    .isIn(VALID_TYPES).withMessage(`type must be one of: ${VALID_TYPES.join(", ")}`),

  check("name.en").notEmpty().withMessage("name.en is required"),
  check("name.ru").notEmpty().withMessage("name.ru is required"),
  check("name.kg").notEmpty().withMessage("name.kg is required"),
];

const updateTagValidator = [
  check("type")
    .optional()
    .isIn(VALID_TYPES).withMessage(`type must be one of: ${VALID_TYPES.join(", ")}`),

  check("name.en").optional().notEmpty().withMessage("name.en cannot be empty"),
  check("name.ru").optional().notEmpty().withMessage("name.ru cannot be empty"),
  check("name.kg").optional().notEmpty().withMessage("name.kg cannot be empty"),
];

const idValidator = [
  param("id").custom((id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid tag id");
    return true;
  }),
];

module.exports = { addTagValidator, updateTagValidator, idValidator };
