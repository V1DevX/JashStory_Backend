const { Tag, Post } = require("../models");

// Generates a URL-safe slug from a string
function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ensures the slug is unique; appends timestamp if collision detected
async function uniqueSlug(base, excludeId = null) {
  const filter = { slug: base, ...(excludeId && { _id: { $ne: excludeId } }) };
  const exists = await Tag.findOne(filter).lean();
  return exists ? `${base}-${Date.now()}` : base;
}

// ─── POST /api/tags ────────────────────────────────────────────────────────────
const addTag = async (req, res, next) => {
  try {
    const { type, name, period, location, status } = req.body;
    const { _id: userId } = res.locals.user;

    const slug = await uniqueSlug(toSlug(name.en));

    const tag = new Tag({
      type,
      name,
      slug,
      period:    period   ?? null,
      location:  location ?? null,
      status:    status   ?? "active",
      createdBy: userId,
    });

    await tag.save();

    return res.status(201).json({
      status:  true,
      message: "Tag created successfully",
      data:    tag,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/tags/:id ─────────────────────────────────────────────────────────
const updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { _id: userId } = res.locals.user;
    const { type, name, period, location, status, slug: customSlug } = req.body;

    const tag = await Tag.findById(id);
    if (!tag) {
      return res.status(404).json({ status: false, message: "Tag not found" });
    }

    if (type)               tag.type     = type;
    if (period  !== undefined) tag.period   = period;
    if (location !== undefined) tag.location = location;
    if (status)             tag.status   = status;

    if (name) {
      tag.name = { ...tag.name.toObject(), ...name };

      // Regenerate slug if name.en changed and no custom slug provided
      if (name.en && !customSlug) {
        tag.slug = await uniqueSlug(toSlug(name.en), id);
      }
    }

    if (customSlug) {
      const conflict = await Tag.findOne({ slug: customSlug, _id: { $ne: id } }).lean();
      if (conflict) {
        return res.status(400).json({ status: false, message: "Slug already in use" });
      }
      tag.slug = customSlug;
    }

    tag.updatedBy = userId;
    await tag.save();

    return res.status(200).json({
      status:  true,
      message: "Tag updated successfully",
      data:    tag,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/tags/:id ──────────────────────────────────────────────────────
const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) {
      return res.status(404).json({ status: false, message: "Tag not found" });
    }

    // Remove the tag reference from all posts
    await Post.updateMany({ tags: id }, { $pull: { tags: id } });

    return res.status(200).json({
      status:  true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/tags ─────────────────────────────────────────────────────────────
// Query: ?q=text  &type=person  &lang=ru  &page=1  &size=20
const getTags = async (req, res, next) => {
  try {
    const { q, type, lang = "en", page, size } = req.query;

    const sizeNumber = parseInt(size) || 20;
    const pageNumber = parseInt(page) || 1;

    const filter = { status: "active" };
    if (type) filter.type = type;
    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [
        { "name.en": rx },
        { "name.ru": rx },
        { "name.kg": rx },
      ];
    }

    const total = await Tag.countDocuments(filter);
    const pages = Math.ceil(total / sizeNumber);

    const tags = await Tag.find(filter)
      .select(`type name.${lang} slug stats.postsCount`)
      .skip((pageNumber - 1) * sizeNumber)
      .limit(sizeNumber)
      .sort({ "stats.postsCount": -1, _id: -1 })
      .lean();

    return res.status(200).json({
      status:  true,
      message: "Tags fetched successfully",
      data:    { tags, total, pages },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/tags/:id ─────────────────────────────────────────────────────────
const getTag = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findById(id)
      .select("-translations -createdBy -updatedBy")
      .lean();

    if (!tag) {
      return res.status(404).json({ status: false, message: "Tag not found" });
    }

    return res.status(200).json({
      status:  true,
      message: "Tag fetched successfully",
      data:    tag,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/tags/slug/:slug ──────────────────────────────────────────────────
const getTagBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const tag = await Tag.findOne({ slug })
      .select("-translations -createdBy -updatedBy")
      .lean();

    if (!tag) {
      return res.status(404).json({ status: false, message: "Tag not found" });
    }

    return res.status(200).json({
      status:  true,
      message: "Tag fetched successfully",
      data:    tag,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/tags/:id/posts ───────────────────────────────────────────────────
// Query: ?lang=ru  &page=1  &size=10
const getTagPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = "en", page, size } = req.query;

    const tag = await Tag.findById(id).lean();
    if (!tag) {
      return res.status(404).json({ status: false, message: "Tag not found" });
    }

    const sizeNumber = parseInt(size) || 10;
    const pageNumber = parseInt(page) || 1;

    const filter = { tags: id, status: "published" };

    const total = await Post.countDocuments(filter);
    const pages = Math.ceil(total / sizeNumber);

    const posts = await Post.find(filter)
      .select(`_id previewImage ${lang}.title ${lang}.desc`)
      .skip((pageNumber - 1) * sizeNumber)
      .limit(sizeNumber)
      .sort({ createdAt: -1 })
      .lean();

    const data = posts.map((post) => {
      const langData = post[lang] || {};
      return {
        _id:          post._id,
        previewImage: post.previewImage,
        title:        langData.title,
        desc:         langData.desc,
      };
    });

    return res.status(200).json({
      status:  true,
      message: "Tag posts fetched successfully",
      data:    { posts: data, total, pages },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addTag, updateTag, deleteTag, getTags, getTag, getTagBySlug, getTagPosts };
