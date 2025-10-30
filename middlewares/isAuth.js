const jwt = require("jsonwebtoken");
const { jwtAccessSecret } = require("../config/kyes");

const isAuth = (allowed=null) => (req, res, next) => {
	// Extract JWT token from Authorization header
	const h = req.headers.authorization || '';
	const accessToken = h.startsWith('Bearer ') ? h.slice(7) : null;
	if (!accessToken) { res.locals.error = "No token"; return next() }
	
	try {
		// Verify JWT token
		const payload = jwt.verify(accessToken, jwtAccessSecret)
		if (!payload) { res.locals.error = "Invalid token"; return next()}
		
		// Check role if allowed is specified
		if(allowed && allowed !== payload.role) {
			// For admins
			if(allowed !== 3) return res.status(403).json({ status: false, message: 'Forbidden' })
			// For user accounts
			return res.status(403).json({ status: false, message: 'Unauthorized' })
		}

		// Attach user info to res.locals
		res.locals.user = {_id: payload.sub, role: payload.role}
		return next()
	} catch (e) {
		return res.status(401).json({status:false, message: 'Expired token'})
	}
};

module.exports = isAuth;
