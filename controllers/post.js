const { Post, User } = require("../models");

const addPost = async (req, res, next) => {
	try {
		const { ru, en, kg, previewImage } = req.body;
		const { _id: userId } = res.locals.user;
		
		const newPost = new Post({
			ru,en,kg,
			previewImage,
			createdBy: userId,
		});

		await newPost.save();

		return res.status(201).json({
			status: true,
			message: "Post added successfully",
			data: newPost,
		});
	} catch (error) {
		next(error);
	}
};

// ✅ Update Post
const updatePost = async (req, res, next) => {
	try {
		const { id } = req.params;
		const updateFields = req.body;

		// Validate status ['published', 'hidden']
		if(updateFields.status) {
			const validStatuses = ['published', 'hidden'];
			if (!validStatuses.includes(updateFields.status)) {
				return res.status(400).json({ 
					message: 'Invalid status. Valid statuses: published, hidden',
				});
			}
		}

		// Update test
		const test = await Post.findByIdAndUpdate(
			id,
			{ $set: updateFields },
			{ new: true, runValidators: true }
		);

		if (!test) return res.status(404).json({ status: false, message: "Test not found" });

		res.status(200).json({
			status: true,
			message: "Test updated successfully",
			data: test
		});
	} catch (error) {
		next(error);
	}
};

// ✅ Delete Post
const deletePost = async (req, res, next) => {
	try {
		const { id } = req.params;

		const post = await Post.findByIdAndDelete(id);

		if (!post) {
			return res.status(404).json({ status: false, message: "Post not found" });
		}

		return res.status(200).json({
			status: true,
			message: "Post deleted successfully",
			data: post,
		});
	} catch (error) {
		next(error);
	}
};

// ✅ Get all posts
const getPosts = async (req, res, next) => {
	try {
		const { lang = "en", details = false } = req.query;

		// Determine if the user is admin
		const isAdmin = details && res.locals.user?.role !== 3;

		/// Определяем, какие поля исключить, используя синтаксис Mongoose
		let selectionObject = {
			'_id': 1,
			'previewImage': 1,
			[`${lang}.title`]: 1, /// Динамически включаем вложенные поля нужного языка
			[`${lang}.desc`]: 1,  ///
			...(isAdmin && { status: 1, test: 1, updatedBy: 1, createdBy: 1, updatedAt: 1, createdAt: 1 })
		};

		let query = Post.find(isAdmin ? {} : { status: { $ne: 'hidden' } })
			.select(selectionObject)

		if(isAdmin) query = query
			.populate("updatedBy", "name")
			.populate("createdBy", "name")

		const posts = await query.lean();

		// Поднимаем title и desc на корневой уровень
		const transformedPosts = posts.map(post => {
			const langData = post[lang] || {};
			
			return {
				_id: post._id,
				previewImage: post.previewImage,
				title: langData.title,
				desc: langData.desc,
				...(isAdmin && {
					status: post.status,
					hasTest: !!post.test,
					updatedBy: post.updatedBy,
					createdBy: post.createdBy,
					updatedAt: post.updatedAt,
					createdAt: post.createdAt,
				}),
			};
		});

		res.status(200).json({
			status: true,
			message: "Posts fetched successfully",
			data: transformedPosts,
		});
	} catch (error) {
		next(error);
	}
};

// ✅ Get single post by ID
const getPost = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { lang = "en", details = false } = req.query;
		const userRole = res.locals.user?.role;
		
		const isAdmin = details && userRole && userRole < 3;

		let selectionObject = {
			'_id': 1,
			'previewImage': 1,
			[`${lang}`]: 1,
			'test': 1,
			...(isAdmin && { 
				status: 1, 
				updatedBy: 1, 
				createdBy: 1, 
				updatedAt: 1, 
				createdAt: 1 
			})
		};

		let query = Post.findById(id).select(selectionObject)

		const testPopulateFields = isAdmin ? 'questions createdBy updatedBy' : `questions.${lang}`;
		query = query.populate('test', testPopulateFields);
		
		if(isAdmin) query = query
			.populate("updatedBy", "name")
			.populate("createdBy", "name")

		const post = await query.lean();

		if (!post) {
			return res.status(404).json({
				status: false,
				message: "Post not found",
			});
		}

		res.status(200).json({
			status: true,
			message: "Post fetched successfully",
			data: post,
		});
	} catch (error) {
		next(error);
	}
};

module.exports = { addPost, updatePost, deletePost, getPosts, getPost };
