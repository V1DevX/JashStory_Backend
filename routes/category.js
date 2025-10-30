const express = require("express");
const router = express.Router();
const { categoryController } = require("../controllers");
const { addCategoryValidator, idValidator } = require("../validators/category");
const validate = require("../validators/validate");
const isAuth = require("../middlewares/isAuth");
router.post(
  "/",
  isAuth,
  addCategoryValidator,
  validate,
  categoryController.addCategory
);

router.put(
  "/:id",
  isAuth,
  idValidator,
  validate,
  categoryController.updateCategory
);

router.delete(
  "/:id",
  isAuth,
  idValidator,
  validate,
  categoryController.deleteCategory
);

router.get("/", isAuth, categoryController.getCategories);

router.get(
  "/:id",
  isAuth,
  idValidator,
  validate,
  categoryController.getCategory
);

module.exports = router;
