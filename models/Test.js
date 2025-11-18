const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
	{
		text: { type: String, required: true },
		options: [{
			text: { type: String, required: true },
			isCorrect: { type: Boolean, default: false },
		}],
		desc: { type: String, required: true },
	},
	{ _id: false }
);

const questionsLangSchema = new mongoose.Schema(
	{
		en: { type: [questionSchema], required: true },
		ru: { type: [questionSchema], required: true },
		kg: { type: [questionSchema], required: true },
	},
	{ _id: false }
);

const testSchema = new mongoose.Schema(
	{
		questions: { type: questionsLangSchema, required: true },
		post: { type: mongoose.Schema.Types.ObjectId, ref: "post", default: null },

		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("test", testSchema);
