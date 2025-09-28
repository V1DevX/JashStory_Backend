const jwt = require("jsonwebtoken");
const { jwtAccessSecret } = require("../config/kyes");

const isAuth = (req, res, next) => {
	const h = req.headers.authorization || '';
	const accessToken = h.startsWith('Bearer ') ? h.slice(7) : null;
	if (!accessToken) return res.status(401).json({ status:false, message:'No token' });
	
	try {
		const payload = jwt.verify(accessToken, jwtAccessSecret)
		if (!payload) return res.status(401).json({ status: false, message: 'Invalid token'});
		
		res.locals.user = {_id: payload.sub, role: payload.role}
		next()
	} catch (e) {
		return res.status(401).json({status:false, message: 'Expired token'})
	}
};

module.exports = isAuth;
