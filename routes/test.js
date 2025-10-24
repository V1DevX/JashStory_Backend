const express = require("express");
const router = express.Router();
const isAuth = require("../middlewares/isAuth");
const { testController } = require("../controllers");
const {
//   addPostValidator,
//   updatePostValidator,
  idValidator,
} = require("../validators/post");
const validate = require("../validators/validate");

router.post("/",
  isAuth,
  validate,
  testController.createTest);

router.put( "/:id",
  isAuth,
  // updatePostValidator,
  idValidator,
  validate,
  testController.updateTest);

router.delete("/:id", 
  isAuth, 
  idValidator, 
  validate, 
  testController.deleteTest);

router.get("/:lang", 
  isAuth, 
  idValidator, 
  validate,
  testController.getTests);

router.get("/:id/:lang", 
  idValidator, 
  validate,
  testController.getTest);

module.exports = router;
