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

router.post("/:id",
  isAuth(2),
  validate,
  testController.createTest);

router.put( "/:id",
  isAuth(2),
  // updatePostValidator,
  validate,
  testController.updateTest);

router.delete("/:id", 
  isAuth(2), 
  validate, 
  testController.deleteTest);

router.get("/:id",
  isAuth(),
  (req, res, next)=>{console.log('2 middleware test'); next();},
  validate,
  testController.getTest);
    
router.get("/list/:lang", 
  isAuth(), 
  validate,
  testController.getTests);

module.exports = router;
