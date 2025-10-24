const Test = require('../models');
const Post = require('../models');
const mongoose = require('mongoose');

const createTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    const { _id: userId } = res.locals.user;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ status: false, message: "Post not found" });

    const existing = await Test.findById(id);
    if (existing) return res.status(400).json({ status: false, message: "Test already exists for this post" });

    const test = new Test({
      _id: new mongoose.Types.ObjectId(id), // общий id с постом
      questions,
      createdBy: userId
    });
    await test.save();

    res.status(201).json({
      status: true,
      message: "Test created successfully",
      data: test
    });
  } catch (error) {
    next(error);
  }
};

const getTests = async (req, res, next) => {
  try {
    // Only for admins
    const { id, lang = "en" } = req.params;
    const tests = await Test.find().lean();
    if (!tests) return res.status(404).json({ status: false, message: "Test not found" });

    res.status(200).json({
      status: true,
      message: "Tests fetched successfully",
      data: tests
    });
  } catch (error) {
    next(error);
  }
};

const getTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id).lean();
    if (!test) return res.status(404).json({ status: false, message: "Test not found" });

    res.status(200).json({
      status: true,
      message: "Test fetched successfully",
      data: test
    });
  } catch (error) {
    next(error);
  }
};

const updateTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;

    const test = await Test.findByIdAndUpdate(
      id,
      { $set: { questions } },
      { new: true }
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

const deleteTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Test.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ status: false, message: "Test not found" });

    res.status(200).json({
      status: true,
      message: "Test deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createTest,
  getTests,
  getTest,
  updateTest,
  deleteTest
};
