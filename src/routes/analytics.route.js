const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, async (req, res) => {
    const result = await analyticsController.getAnalytics();
    return res.status(result.ok ? 200 : 400).json(result);
});

module.exports = router;
