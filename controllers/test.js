const { Test, Post } = require('../models');
const mongoose = require('mongoose');

const createTest = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { questions } = req.body;
		const { _id: userId } = res.locals.user;
		
		const post = await Post.findById(id);
		if (!post) return res.status(404)
			.json({ status: false, message: "Post not found" });
		if (post.hasTest) return res.status(400)
			.json({ status: false, message: "Post already has a test" });
		
		if (
			questions['en'].length === 0 || 
			questions['ru'].length === 0 || 
			questions['kg'].length === 0
		) {
			return res.status(400)
			.json({ status: false, message: "Questions must be a non-empty array" });
		}
		/// Creating test
		


		const test = new Test({
			questions,
			post: post._id,
			createdBy: userId,
		});
		await test.save();

		// Updating post
		post.test = test._id;
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
	try {
		const { id } = req.params;
		const { lang='en', answers=false, isEditMode=false } = req.query;
		const isAdmin = res.locals.user?.role < 3;
		const editMode = isEditMode && isAdmin; // Only admins can have edit mode
		
		let query = Test.findById(id); 
		const baseQuestionFields = 'options'; 
		
		if (editMode) {
				query = query.select(`questions en ru kg createdBy updatedBy ${baseQuestionFields}`);
				query = query.populate("createdBy updatedBy", "name email");
		} else {
				query = query.select(`questions ${lang} ${answers? '' : '-isCorrect'} ${baseQuestionFields}`);
		}
		
		// 4. Выполнение запроса
		const test = await query.lean();

		if (!test) return res.status(404).json({ status: false, message: "Test not found" });

		// // Delete answers // TODO: fix it
		// if (!editMode && !answers) { 
		// test.questions.forEach(question => {
		// 	question.options.forEach(option => {
		// 		delete option.isCorrect;
		// 	});
		// })

		res.status(200).json({
			status: true,
			message: "Test fetched successfully",
			data: {
				_id: test._id,
				...test,
			}
		});
	} catch (error) {
		next(error);
	}
};

const getResults = async (req, res, next) => {
	// TODO
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
	// TODO
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
		const test = await Test.findById(id);
		if (!test) return res.status(404).json({ status: false, message: "Test not found" });

		if(test.post) {
			const post = await Post.findById(test.post);
			if (post) {
				post.test = null;
				await post.save();
			}
		}

		await test.deleteOne()

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
