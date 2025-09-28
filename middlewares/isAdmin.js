const isAdmin = (...allowed) => (req, res, next) => {
	if(!req.user) return res.status(401).json({ status: false, message: 'Unauthorized' })
	if(!allowed.includes(res.user.role)) {
		return res.status(403).json({ status: false, message: 'Forbidden' })
	}
	next()
};

module.exports = isAdmin;
