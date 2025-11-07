const { Post } = require("../models");

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
		// const { ru, en, kg, previewImage, status } = req.body;
		const changes = req.body;
		const userId = req.user._id
		
		const post = await Post.findById(id);
		if (!post) {
			return res.status(404).json({ status: false, message: "Post not found" });
		}
		
		// User info for updatedBy
		if(userId) {
			post.updatedBy = userId;
			// Обновляем только то, что пришло
			for (const key in changes) {
				if (post[key] !== undefined) {
					post[key] = changes[key];
				}
			}
			// if (ru) post.ru = ru;
			// if (en) post.en = en;
			// if (kg) post.kg = kg;
			// if (previewImage) post.previewImage = previewImage;
			// if (status) post.status = status;
		} 
		else res.status(401).json({ status: false, message: "Unknown user" });

		await post.save();

		return res.status(200).json({
			status: true,
			message: "Post updated successfully",
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
		const { lang = "en" } = req.params;
		
		// Determine if the user is admin
		const isAdmin = res.locals.user?.role !== 3;

		/// Определяем, какие поля исключить, используя синтаксис Mongoose
		let selectionObject = {
			'_id': 1,
			'previewImage': 1,
			[`${lang}.title`]: 1, /// Динамически включаем вложенные поля нужного языка
			[`${lang}.desc`]: 1,  ///
			...(isAdmin && { status: 1, hasTest: 1, updatedBy: 1, createdBy: 1, updatedAt: 1, createdAt: 1 })
		};

		let query = Post.find().select(selectionObject)
		if(isAdmin) query = query
			.populate("updatedBy", "name")
			.populate("createdBy", "name")

		const posts = await query.lean()

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
					hasTest: post.hasTest,
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
		const { id, lang = "en" } = req.params;

		const post = await Post.findById(id)
			.select(`${lang} previewImage updatedBy createdAt`) 
			.populate("updatedBy", "name email")
			.lean();

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
