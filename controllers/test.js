const { Test, Post } = require('../models');
const mongoose = require('mongoose');

const createTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    const { _id: userId } = res.locals.user;
    console.log(questions);
    
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ status: false, message: "Post not found" });
    if (post.hasTest) return res.status(400).json({ status: false, message: "Post already has a test" });

    const test = new Test({
      _id: new mongoose.Types.ObjectId(id), // общий id с постом
      questions: questions,
      createdBy: userId,
    });
    await test.save();

    post.hasTest = true;
    await post.save();

    res.status(201).json({
      status: true,
      message: "Test created successfully",
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

const getTests = async (req, res, next) => {
  try {
    const { lang = "en" } = req.params;

    // Determine if the user is admin
    const isAdmin = res.locals.user?.role !== 3;

    // Select fields based on the user's role
    const selectionObject = {
      _id: 1,
      [lang]: 1,
      ...(isAdmin && { createdBy: 1, updatedBy: 1 })
    };

    const tests = await Test.find().select(selectionObject).lean();

    // Transform the tests to bring the language block to the root level
    const transformed = tests.map(test => {
      const langData = test[lang] || {};
      return {
        _id: test._id,
        ...langData,
        ...(isAdmin && { createdBy: test.createdBy, updatedBy: test.updatedBy })
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
  console.log('hi');
  try {
    const { id } = req.params;
    const { lang='en', isEditMode=false } = req.query;
    const isAdmin = res.locals.user?.role !== 3;

    // isEditMode indicates if the request is for editing purposes
    if(isEditMode) {
      if(!res.locals.user) {
        return res.status(401).json({ status: false, message: 'Unauthorized' });
      }

      // If isEditMode is true, ensure the user is not an admin
      if (isEditMode && !isAdmin) {
        res.status(403).json({ status: false, message: 'Forbidden' });
      }
    }
    
    
    
    const test = await Test.findById(id)
    
    if (!test) return res.status(404).json({ status: false, message: "Test not found" });
    
    // Secretly select fields based on role and isEditMode
    if (isAdmin && isEditMode) {
      test.select('createdBy updatedBy');
      test.populate("createdBy", "name email")
      test.populate("updatedBy", "name email")
    } else {
      test.select(`${lang}`);
    }
    test.lean();
    
    // Data to return
    const data = isAdmin && isEditMode ? test : test[lang];
    if (!isAdmin) {
      // Delete correct answers for non-admin users
      data.questions.forEach(question => {
        question.options.forEach(option => {
          delete option.isCorrect;
        });
      });
    }
    res.status(200).json({
      status: true,
      message: "Test fetched successfully",
      data: {
        _id: test._id,
        ...data,
      }
    });
  } catch (error) {
    next(error);
  }
};

const getResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // answers should be an array of selected option indices

    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ status: false, message: "Test not found" });

    let correctCount = 0;
    test.questions.forEach((question, index) => {
      const selectedOptionIndex = answers[index];
      if (question.options[selectedOptionIndex]?.isCorrect) {
        correctCount++;
      }
    });

    res.status(200).json({
      status: true,
      message: "Results calculated successfully",
      data: {
        totalQuestions: test.questions.length,
        correctAnswers: correctCount,
        score: (correctCount / test.questions.length) * 100
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
