const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const {
	saveRefreshRecord,
	findRefreshRecord,
	markUsed,
	revokeFamily,
} = require("./refreshTokenService");
const { isProd, jwtAccessSecret, jwtRefreshSecret } = require("../../config/kyes");

function generateAccessToken(user) {
	return jwt.sign(
		{ sub: user._id, role: user.role },
		jwtAccessSecret,
		{ expiresIn: "24h" } // lives 24 hour
	);
}

async function generateRefreshToken(user, prevTokenId) {
	const jti = uuid();

	const refreshToken = jwt.sign(
		{ sub: user._id, jti},
		jwtRefreshSecret,
		{ expiresIn: "30d" } // lives 30 days
	);
	
	await saveRefreshRecord(user._id, jti, prevTokenId);

	return refreshToken;
}

const issueRefresh = async (res, user, prevRefreshToken = null) => {
	const refreshToken = await generateRefreshToken(user, prevRefreshToken)
	
	res.cookie('jid', refreshToken, {
		/// TODO: Fix this bug
		/// idk why, but if turn if on it'll crush.
		
		httpOnly: true,
		secure: isProd, // https
		sameSite: (isProd ? 'Lax' : 'none'),
		path: '/auth',       // ограничим область
		maxAge: 30*24*3600*1000
	});
	
	return refreshToken;
}

const revokeRefreshToken = async (refreshToken) => {
	try {
		const payload = jwt.verify(refreshToken, jwtRefreshSecret)
		await revokeFamily(payload.sub)
	} catch {}
}

const refreshTokenFunc = async (refreshToken) => {
	try {
		const payload = jwt.verify(refreshToken, jwtRefreshSecret)
		const record = await findRefreshRecord(payload.jti);

		if (!record || record.used || record.revoked ) {
			await revokeFamily(payload.sub);
		}
		await markUsed(record.jti)

		return { payload, record }

	} catch (e) {
		console.log(e);
		
		return false
	}
}

module.exports = { 
	generateAccessToken, 
	generateRefreshToken, 
	issueRefresh,
	revokeRefreshToken,
	refreshTokenFunc
};
