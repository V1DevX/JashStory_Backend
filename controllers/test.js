const { Test, Post } = require('../models');
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
    const { lang = "en" } = req.params;

    // Выбираем только требуемый языковой блок и _id
    const selectionObject = {
      _id: 1,
      [lang]: 1,
      createdBy: 1,
      updatedBy: 1
    };

    const tests = await Test.find().select(selectionObject).lean();

    // Поднимаем языковой блок на корневой уровень
    const transformed = tests.map(test => {
      const langData = test[lang] || {};
      return {
        _id: test._id,
        ...langData,
        createdBy: test.createdBy,
        updatedBy: test.updatedBy
      };
    });

    res.status(200).json({
      status: true,
      message: "Tests fetched successfully",
      data: transformed
    });
  } catch (error) {
    next(error);
  }
};

const getTest = async (req, res, next) => {
  try {
    const { id, lang = "en" } = req.params;

    const test = await Test.findById(id)
      .select(`${lang} createdBy updatedBy`)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean();

    if (!test) return res.status(404).json({ status: false, message: "Test not found" });

    const langData = test[lang] || {};

    res.status(200).json({
      status: true,
      message: "Test fetched successfully",
      data: {
        _id: test._id,
        ...langData,
        createdBy: test.createdBy,
        updatedBy: test.updatedBy
      }
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
