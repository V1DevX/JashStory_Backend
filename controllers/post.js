const { Post } = require("../models");

const addPost = async (req, res, next) => {
  try {
    const { ru, en, kg, previewImage } = req.body;
    const { _id: userId } = req.user;

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
    const posts = await Post.find()
      .select(`${lang} previewImage updatedBy createdAt`) 
      .populate("updatedBy", "name email")
      .lean();

    res.status(200).json({
      status: true,
      message: "Posts fetched successfully",
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get single post by ID
const getPost = async (req, res, next) => {
  try {
    const { id, lang = "en" } = req.params;
    // const {  } = req.query;

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

// const getPosts = async (req, res, next) => {
//   try {
//     const { _start = 0, _end = 10, _sort = "id", _order = "ASC" } = req.query;
    
//     const posts = await Post.find()
//       .skip(parseInt(_start))
//       .limit(parseInt(_end) - parseInt(_start))
//       .sort({ [_sort]: _order.toLowerCase() === "desc" ? -1 : 1 })
//       .populate("file")
//       .populate("category")
//       .populate("updatedBy", "-password -verificationCode -forgotPasswordCode");
    
//     const total = await Post.countDocuments();
//     res.set({
//       'Access-Control-Expose-Headers': 'X-Total-Count'
//     }).status(200).json({
//       data: posts.map(p => p.toObject()),  // Обязательно - массив данных
//       total,                               // Общее количество записей для пагинации
//     });
//   } catch (err) {
//     res.status(500).json({ status: false, message: "Server error" });
//   }
// };

// const getPost = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const post = await Post.findById(id)
//       .populate("file")
//       // .populate("category")
//       .populate("updatedBy", "-password -verificationCode -forgotPasswordCode");
//     if (!post) {
//       return res.status(404).json({ status: false, message: "Post not found" });
//     }

//     res.status(200).json({
//       status: true,
//       message: "Get post successfully",
//       data: { id, post },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const getPost = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const post = await Post.findById(id)
//       .populate("file")
//       .populate("category")
//       .populate("updatedBy", "-password -verificationCode -forgotPasswordCode");

//     if (!post) {
//       return res.status(404).json({ status: false, message: "Post not found" });
//     }

//     // Правильный формат для react-admin
//     res.status(200).json({

//       data: post.toObject(),  // Обязательно! React-admin ожидает данные в поле `data`
//       total: 1,               // Для корректной пагинации, если список
//     });
//   } catch (error) {
//     next(error);
//   }
// }


module.exports = { addPost, updatePost, deletePost, getPosts, getPost };
