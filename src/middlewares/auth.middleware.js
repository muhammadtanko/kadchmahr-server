const jwt = require("jsonwebtoken");
const { webToken } = require("../config");

module.exports = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ ok: false, message: "No token provided" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    try {
        const decoded = jwt.verify(token, webToken.secretKey);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ ok: false, message: "Invalid or expired token" });
    }
};
