const express = require("express");
const router = express.Router();
const { categoryController } = require("../controllers");
const { addCategoryValidator, idValidator } = require("../validators/category");
const validate = require("../validators/validate");
const isAuth = require("../middlewares/isAuth");

router.post("/",    isAuth(2), addCategoryValidator, validate, categoryController.addCategory);
router.put("/:id",  isAuth(2), idValidator, validate, categoryController.updateCategory);
router.delete("/:id", isAuth(2), idValidator, validate, categoryController.deleteCategory);
router.get("/",     isAuth(2), categoryController.getCategories);
router.get("/:id",  isAuth(2), idValidator, validate, categoryController.getCategory);

module.exports = router;
