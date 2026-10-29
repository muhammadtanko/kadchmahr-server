const express = require("express");
const router = express.Router();
const notifCtrl = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/user/:id", authMiddleware, async (req, res) => {
    const result = await notifCtrl.getUserNotifications(req.params.id);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.put("/:id/read", authMiddleware, async (req, res) => {
    const result = await notifCtrl.markRead(req.params.id);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.put("/read-all/:userId", authMiddleware, async (req, res) => {
    const result = await notifCtrl.markAllRead(req.params.userId);
    return res.status(result.ok ? 200 : 400).json(result);
});

module.exports = router;
