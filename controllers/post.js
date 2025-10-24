const { Post } = require("../models");

const addPost = async (req, res, next) => {
	try {
		const { ru, en, kg, previewImage } = req.body;
		const { _id: userId } = res.locals.user;
		
		const newPost = new Post({
			ru,en,kg,
			previewImage,
			updatedBy: userId,
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
		const { ru, en, kg, previewImage } = req.body;
		const userId = req.user._id

		const post = await Post.findById(id);
		if (!post) {
			return res.status(404).json({ status: false, message: "Post not found" });
		}

		// Обновляем только то, что пришло
		if (ru) post.ru = ru;
		if (en) post.en = en;
		if (kg) post.kg = kg;
		if (previewImage) post.previewImage = previewImage;
		if (userId) post.updatedBy = userId;

		await post.save();

		return res.status(200).json({
			status: true,
			message: "Post updated successfully",
			data: post,
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
		
		// const isAdmin = false;
		// const h = req.headers.authorization || '';	// Null - todo:fix
		// const accessToken = h.startsWith('Bearer ') ? h.slice(7) : null;
		
		// if(accessToken) {
		// 	const payload = jwt.verify(accessToken, jwtAccessSecret)
		// 	if(payload && payload.role < 2) { isAdmin = true }
		// }

		// Определяем, какие поля исключить, используя синтаксис Mongoose
		let selectionObject = {
			'_id': 1,
			'previewPhoto': 1,
			[`${lang}.title`]: 1, // Динамически включаем вложенные поля нужного языка
			[`${lang}.desc`]: 1,  //
			// ...(isAdmin && { createdBy: 1, updatedBy: 1 })
		};

		let query = Post.find().select(selectionObject)
		// if(isAdmin) query = query.populate("updatedBy", "name email")

		const posts = await query.lean()

		// Поднимаем title и desc на корневой уровень
		const transformedPosts = posts.map(post => {
			const langData = post[lang] || {};
			
			return {
				_id: post._id,
				previewPhoto: post.previewPhoto,
				title: langData.title,
				desc: langData.desc,
				// ...(isAdmin && { createdBy: post.createdBy, updatedBy: post.updatedBy }),
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
