const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    // If no token exists, return unauthorized
    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        const bearerToken = token.split(' ')[1];
        const verified = jwt.verify(bearerToken, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        // Return 403 Forbidden for invalid tokens as requested
        res.status(403).json({ message: "Invalid Token. Access Forbidden.", redirect: true });
    }
};

module.exports = verifyToken;
