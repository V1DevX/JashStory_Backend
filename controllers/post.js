const mongoose = require("mongoose");
const { Post } = require("../models");

// ─── POST /api/posts ───────────────────────────────────────────────────────────
const addPost = async (req, res, next) => {
	try {
		const { ru, en, kg, previewImage, category, tags, status } = req.body;
		const { _id: userId } = res.locals.user;

		const newPost = new Post({
			ru,
			en,
			kg,
			previewImage,
			category: category ?? null,
			tags:     tags     ?? [],
			status:   status   ?? "draft",
			createdBy: userId,
		});

		await newPost.save();

		return res.status(201).json({
			status:  true,
			message: "Post added successfully",
			data:    newPost,
		});
	} catch (error) {
		next(error);
	}
};

// ─── PUT /api/posts/:id ────────────────────────────────────────────────────────
const updatePost = async (req, res, next) => {
	try {
		const { id }          = req.params;
		const { _id: userId } = res.locals.user;
		const updateFields    = { ...req.body, updatedBy: userId };

		if (updateFields.status) {
			const validStatuses = ["draft", "published", "hidden"];
			if (!validStatuses.includes(updateFields.status)) {
				return res.status(400).json({
					status:  false,
					message: `Invalid status. Valid values: ${validStatuses.join(", ")}`,
				});
			}
		}

		const post = await Post.findByIdAndUpdate(
			id,
			{ $set: updateFields },
			{ new: true, runValidators: true }
		);

		if (!post) {
			return res.status(404).json({ status: false, message: "Post not found" });
		}

		return res.status(200).json({
			status:  true,
			message: "Post updated successfully",
			data:    post,
		});
	} catch (error) {
		next(error);
	}
};

// ─── DELETE /api/posts/:id ─────────────────────────────────────────────────────
const deletePost = async (req, res, next) => {
	try {
		const { id } = req.params;

		const post = await Post.findByIdAndDelete(id);

		if (!post) {
			return res.status(404).json({ status: false, message: "Post not found" });
		}

		return res.status(200).json({
			status:  true,
			message: "Post deleted successfully",
			data:    post,
		});
	} catch (error) {
		next(error);
	}
};

// ─── GET /api/posts ────────────────────────────────────────────────────────────
// Query:
//   lang=en|ru|kg          — language for title/desc  (default: en)
//   details=true           — include admin fields (requires auth with role < 3)
//   tags[and]=id1,id2      — posts that have ALL of these tags
//   tags[or]=id3,id4       — posts that have AT LEAST ONE of these tags
//   tags[not]=id5          — posts that have NONE of these tags
const getPosts = async (req, res, next) => {
	try {
		const { lang = "en", details = false } = req.query;

		const isAdmin = details && res.locals.user?.role < 3;

		// ── Tag filter ────────────────────────────────────────────────────────────
		const tagConditions = buildTagFilter(req.query.tags);

		const baseFilter = isAdmin ? {} : { status: "published" };
		const filter = tagConditions.length
			? { ...baseFilter, $and: tagConditions }
			: baseFilter;

		// ── Field selection ───────────────────────────────────────────────────────
		const selectionObject = {
			_id:                  1,
			previewImage:         1,
			tags:                 1,
			[`${lang}.title`]:    1,
			[`${lang}.desc`]:     1,
			...(isAdmin && {
				status:    1,
				test:      1,
				category:  1,
				updatedBy: 1,
				createdBy: 1,
				updatedAt: 1,
				createdAt: 1,
			}),
		};

		let query = Post.find(filter)
			.select(selectionObject)
			.populate("tags", `name.${lang} slug type`);

		if (isAdmin) {
			query = query
				.populate("updatedBy", "name")
				.populate("createdBy", "name");
		}

		const posts = await query.lean();

		const transformedPosts = posts.map((post) => {
			const langData = post[lang] || {};
			return {
				_id:          post._id,
				previewImage: post.previewImage,
				title:        langData.title,
				desc:         langData.desc,
				tags:         post.tags,
				...(isAdmin && {
					status:    post.status,
					hasTest:   !!post.test,
					category:  post.category,
					updatedBy: post.updatedBy,
					createdBy: post.createdBy,
					updatedAt: post.updatedAt,
					createdAt: post.createdAt,
				}),
			};
		});

		return res.status(200).json({
			status:  true,
			message: "Posts fetched successfully",
			data:    transformedPosts,
		});
	} catch (error) {
		next(error);
	}
};

// ─── GET /api/posts/:id ────────────────────────────────────────────────────────
const getPost = async (req, res, next) => {
	try {
		const { id }                     = req.params;
		const { lang = "en", details = false } = req.query;
		const userRole                   = res.locals.user?.role;

		const isAdmin = details && userRole && userRole < 3;

		const selectionObject = {
			_id:          1,
			previewImage: 1,
			tags:         1,
			[`${lang}`]:  1,
			test:         1,
			...(isAdmin && {
				status:    1,
				category:  1,
				updatedBy: 1,
				createdBy: 1,
				updatedAt: 1,
				createdAt: 1,
			}),
		};

		const testPopulateFields = isAdmin
			? "questions createdBy updatedBy"
			: `questions.${lang}`;

		let query = Post.findById(id)
			.select(selectionObject)
			.populate("test", testPopulateFields)
			.populate("tags", `name.${lang} slug type period location`);

		if (isAdmin) {
			query = query
				.populate("updatedBy", "name")
				.populate("createdBy", "name");
		}

		const post = await query.lean();

		if (!post) {
			return res.status(404).json({ status: false, message: "Post not found" });
		}

		return res.status(200).json({
			status:  true,
			message: "Post fetched successfully",
			data:    post,
		});
	} catch (error) {
		next(error);
	}
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a MongoDB $and conditions array from the `tags` query object.
 *
 * Accepts:  tags[and]=id1,id2  tags[or]=id3,id4  tags[not]=id5
 *
 *   AND  → article must have ALL listed tags
 *   OR   → article must have AT LEAST ONE listed tag
 *   NOT  → article must have NONE of the listed tags
 */
function buildTagFilter(tags) {
	if (!tags || typeof tags !== "object") return [];

	const parseIds = (str) =>
		String(str ?? "")
			.split(",")
			.map((s) => s.trim())
			.filter((s) => mongoose.Types.ObjectId.isValid(s));

	const andIds = parseIds(tags.and);
	const orIds  = parseIds(tags.or);
	const notIds = parseIds(tags.not);

	const conditions = [];

	// Each AND tag must appear in the post's tags array
	andIds.forEach((id) => conditions.push({ tags: id }));

	// At least one OR tag must appear
	if (orIds.length)  conditions.push({ tags: { $in:  orIds  } });

	// None of the NOT tags may appear
	if (notIds.length) conditions.push({ tags: { $nin: notIds } });

	return conditions;
}

module.exports = { addPost, updatePost, deletePost, getPosts, getPost };
