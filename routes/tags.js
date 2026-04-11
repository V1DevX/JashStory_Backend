const express = require("express");
const router  = express.Router();

const { tagsController } = require("../controllers");
const { addTagValidator, updateTagValidator, idValidator } = require("../validators/tags");
const validate = require("../validators/validate");
const isAuth   = require("../middlewares/isAuth");

// ─── Public ────────────────────────────────────────────────────────────────────
router.get("/",            tagsController.getTags);
router.get("/slug/:slug",  tagsController.getTagBySlug);
router.get("/:id/posts",   idValidator, validate, tagsController.getTagPosts);
router.get("/:id",         idValidator, validate, tagsController.getTag);

// ─── Admin only (role ≤ 2) ─────────────────────────────────────────────────────
router.post(  "/",    isAuth(2), addTagValidator,    validate, tagsController.addTag);
router.put(   "/:id", isAuth(2), idValidator, updateTagValidator, validate, tagsController.updateTag);
router.delete("/:id", isAuth(2), idValidator,        validate, tagsController.deleteTag);

module.exports = router;
