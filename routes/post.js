const express = require("express");
const router = express.Router();
const isAuth = require("../middlewares/isAuth");
const { postController } = require("../controllers");
const {
  addPostValidator,
  updatePostValidator,
  idValidator,
} = require("../validators/post");
const validate = require("../validators/validate");

router.post("/",
  isAuth(2),
  validate,
  postController.addPost);

router.put( "/:id",
  isAuth(2),
  // updatePostValidator,
  idValidator,
  validate,
  postController.updatePost);

router.delete("/:id", 
  isAuth(2), 
  idValidator, 
  validate, 
  postController.deletePost);

router.get("/:lang", 
  isAuth(),
  postController.getPosts);

router.get("/:id/:lang", 
  idValidator, 
  validate, 
  postController.getPost);

module.exports = router;
