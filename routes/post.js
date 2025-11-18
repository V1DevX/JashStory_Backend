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

router.patch( "/:id",
  isAuth(2),
  // updatePostValidator,
  validate,
  postController.updatePost);

router.delete("/:id", 
  isAuth(2), 
  idValidator, 
  validate, 
  postController.deletePost);

router.get("/list/", 
  isAuth(),
  postController.getPosts);

router.get("/:id", 
  isAuth(),
  idValidator, 
  validate, 
  postController.getPost);

module.exports = router;
