const { JWT_SECRET } = require("./config");
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({});
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.userId) {
            req.userId = decoded.userId; // Attach userId to req object
            next(); // Move to the next middleware or route handler
        } else {
            // If userId is missing, return a 403 response
            return res.status(403).json({ message: "Invalid Token" });
        }
    } catch (err) {
        // If token is invalid or expired, return a 403 response
        return res.status(403).json({ message: "Invalid Token" });
    }
    
};

module.exports = {
    authMiddleware
}