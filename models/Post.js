const mongoose = require("mongoose");

const langSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		desc: { type: String },
		blocks: { type: mongoose.Schema.Types.Mixed },  // prev: content
	},
	{ _id: false }
);

const postSchema = new mongoose.Schema(
	{
		rating: { type: Number, default: 0 },
		reviewsCount: { type: Number, default: 0 },


		en: { type: langSchema, required: true },
		ru: { type: langSchema, required: true },
		kg: { type: langSchema, required: true },

		previewImage: { 
			public_id: {type: String, required: true},
			url: {type: String, required: true},
		},

		status: { type: String, enum: ["draft", "published"], default: "draft" },
		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("post", postSchema);
