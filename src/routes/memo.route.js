const express = require("express");
const router = express.Router();
const memoCtrl = require("../controllers/memo.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { uploadFile } = require("../middlewares/upload.middleware");

// Get all memos (all authenticated users)
router.get("/", authMiddleware, async (req, res) => {
    const result = await memoCtrl.getAllMemos();
    return res.status(result.ok ? 200 : 400).json(result);
});

// Create internal memo (Admin only, JSON body)
router.post("/internal", authMiddleware, async (req, res) => {
    const actorId = req.user?._id ?? req.user?.id;
    const { subject, body } = req.body;
    if (!subject) return res.status(400).json({ ok: false, message: "Subject is required" });
    const result = await memoCtrl.createMemo({ type: "Internal", subject, body, createdBy: actorId });
    return res.status(result.ok ? 201 : 400).json(result);
});

// Upload external memo with file (Admin only, multipart)
router.put("/external", authMiddleware, uploadFile("file", "memos/external"), async (req, res) => {
    const actorId = req.user?._id ?? req.user?.id;
    const { subject, org, received } = req.body;
    if (!subject || !org) return res.status(400).json({ ok: false, message: "Subject and organisation are required" });
    const result = await memoCtrl.createMemo({
        type: "External",
        subject,
        org,
        received,
        fileUrl: req.fileUrl ?? "",
        fileName: req.body.fileName || req.file?.originalname || "",
        createdBy: actorId,
    });
    return res.status(result.ok ? 201 : 400).json(result);
});

module.exports = router;
