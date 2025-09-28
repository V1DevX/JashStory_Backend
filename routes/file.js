const express = require("express");
const router = express.Router();
// const isAuth = require("../middlewares/isAuth");
const { fileController } = require("../controllers");
const upload = require("../middlewares/upload")


router.post( "/upload",
  upload.single("file"),
  fileController.uploadFile);

router.get( "/signed-url", 
  // isAuth, 
  fileController.getSignedUrl);

router.delete( "/delete-file", 
  // isAuth, 
  fileController.deleteFile);

module.exports = router;
