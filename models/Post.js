const mongoose = require("mongoose");

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

/**
 * Content for one language.
 *   title  — article title (required per language)
 *   desc   — short excerpt shown in previews / meta description
 *   blocks — rich content (e.g. Editor.js block array)
 */
const langSchema = new mongoose.Schema(
  {
    title:  { type: String, required: true },
    desc:   { type: String, default: null },
    blocks: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

// ─── Post ─────────────────────────────────────────────────────────────────────

const postSchema = new mongoose.Schema(
  {
    // ── Content (multilingual) ────────────────────────────────────────────────
    // `en` is the primary language and the only required one.
    // `ru` and `kg` can be added later (manually or via auto-translation).
    en: { type: langSchema, required: true },
    ru: { type: langSchema, default: null },
    kg: { type: langSchema, default: null },

    // ── Classification ────────────────────────────────────────────────────────

    // Broad category the article belongs to  (one per post)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    /**
     * Historical tags — multiple, mixed types (person / event / place / era / dynasty / concept).
     * Admins pick from the Tag collection; no duplicates enforced at schema level
     * (validate uniqueness in the controller or with a pre-save hook).
     */
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    // ── Media ─────────────────────────────────────────────────────────────────
    previewImage: {
      public_id: { type: String, required: true },
      url:       { type: String, required: true },
    },

    // ── Engagement (public) ───────────────────────────────────────────────────
    reviewsCount: { type: Number, default: 0 },
    rating: { 
      five:   { type: Number, default: 0 },
      four:   { type: Number, default: 0 },
      three:  { type: Number, default: 0 },
      two:    { type: Number, default: 0 },
      one:    { type: Number, default: 0 },
    },

    // ── Stats (admin-only) ────────────────────────────────────────────────────
    // Update via middleware / background jobs, not directly from API handlers.
    stats: {
      viewsCount:    { type: Number, default: 0 },
      uniqueReaders: { type: Number, default: 0 },
    },

    // ── State ─────────────────────────────────────────────────────────────────
    /**
     * draft     — being written, not visible to anyone except the author
     * hidden    — finished but not yet promoted
     * published — visible to all readers
     */
    status: {
      type: String,
      enum: ["draft", "hidden", "published"],
      default: "draft",
      index: true,
    },

    // Optional linked quiz / test
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      default: null,
      index: true,
    },

    // ── Audit ─────────────────────────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// ─── Tag stats hooks ───────────────────────────────────────────────────────────

// Helper: bulk-update postsCount for a list of tag ids
async function adjustPostsCount(ids, delta) {
  if (!ids.length) return;
  const Tag = mongoose.model("Tag");
  await Tag.updateMany({ _id: { $in: ids } }, { $inc: { "stats.postsCount": delta } });
}

// 1. New post saved with tags → increment
postSchema.pre("save", async function (next) {
  try {
    if (this.isNew && Array.isArray(this.tags) && this.tags.length) {
      await adjustPostsCount(this.tags.map(String), 1);
    }
  } catch (err) {
    console.error("[Post hook] pre-save error:", err.message);
  }
  next();
});

// 2. Tags updated via findByIdAndUpdate → diff old vs new
//    Non-critical: wrapped in try/catch so any failure never blocks the update.
postSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update  = this.getUpdate();
    const newTags = update?.$set?.tags ?? update?.tags;

    // Only run when tags array is explicitly being updated
    if (!Array.isArray(newTags)) return next();

    const doc = await this.model.findOne(this.getQuery()).select("tags").lean();
    if (!doc) return next();

    const oldTagStrs = Array.isArray(doc.tags) ? doc.tags.map(String) : [];
    const newTagStrs = newTags.map(String);

    this._tagDiff = {
      added:   newTagStrs.filter((id) => !oldTagStrs.includes(id)),
      removed: oldTagStrs.filter((id) => !newTagStrs.includes(id)),
    };
  } catch (err) {
    // Tag count sync failed — log and continue; update itself must not fail
    console.error("[Post hook] pre-findOneAndUpdate error:", err.message);
    this._tagDiff = null;
  }
  next();
});

postSchema.post("findOneAndUpdate", async function () {
  try {
    if (!this._tagDiff) return;
    await adjustPostsCount(this._tagDiff.added,   1);
    await adjustPostsCount(this._tagDiff.removed, -1);
  } catch (err) {
    console.error("[Post hook] post-findOneAndUpdate error:", err.message);
  }
});

// 3. Post deleted → decrement all its tags
postSchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getQuery()).select("tags").lean();
    if (Array.isArray(doc?.tags) && doc.tags.length) {
      this._deletedTags = doc.tags.map(String);
    }
  } catch (err) {
    console.error("[Post hook] pre-findOneAndDelete error:", err.message);
  }
  next();
});

postSchema.post("findOneAndDelete", async function () {
  try {
    if (this._deletedTags?.length) {
      await adjustPostsCount(this._deletedTags, -1);
    }
  } catch (err) {
    console.error("[Post hook] post-findOneAndDelete error:", err.message);
  }
});

// ──────────────────────────────────────────────────────────────────────────────

module.exports = mongoose.model("Post", postSchema);
