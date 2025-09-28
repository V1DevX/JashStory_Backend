const mongoose = require('mongoose')

const RefreshTokenSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	jti: { type: String, required: true, unique: true },   // уникальный uuid
	replacedBy: { type: String, default: null },           // какой токен заменил
	used: { type: Boolean, default: false },               // был ли использован
	revoked: { type: Boolean, default: false },            // отозван ли
}, { timestamps: true });

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);