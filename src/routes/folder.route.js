const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const folderCtrl = require("../controllers/folder.controller");

router.get("/", authMiddleware, async (req, res) => {
    const result = await folderCtrl.getAllFolders();
    return res.status(result.ok ? 200 : 400).json(result);
});

router.post("/", authMiddleware, async (req, res) => {
    const actorId = req.user?._id ?? req.user?.id;
    const { name, zone, dept } = req.body;
    if (!name || !zone) return res.status(400).json({ ok: false, message: "name and zone are required" });
    const result = await folderCtrl.createFolder({ name, zone, dept: dept ?? "", createdBy: actorId });
    return res.status(result.ok ? 201 : 400).json(result);
});

module.exports = router;
