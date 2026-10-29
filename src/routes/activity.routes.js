const express = require("express");
const router = express.Router();
const activityCtrl = require("../controllers/activity.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { uploadFile } = require("../middlewares/upload.middleware");

router.post("/", authMiddleware, async (req, res) => {
    const result = await activityCtrl.createActivity(req.body);
    return res.status(result.ok ? 201 : 400).json(result);
});

router.get("/", authMiddleware, async (req, res) => {
    const result = await activityCtrl.getAllActivities();
    return res.status(result.ok ? 200 : 400).json(result);
});

router.get("/user/:id", authMiddleware, async (req, res) => {
    const result = await activityCtrl.getUserActivities(req.params.id);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.put("/:id", authMiddleware, async (req, res) => {
    const actorId = req.user?._id ?? req.user?.id;
    const result = await activityCtrl.updateActivity(req.params.id, req.body, actorId);
    return res.status(result.ok ? 200 : 400).json(result);
});

// Submit activity report (file → R2), advances status to Completed
router.put("/:id/report", authMiddleware, uploadFile("report", "activities/reports"), async (req, res) => {
    if (!req.fileUrl) return res.status(400).json({ ok: false, message: "No file uploaded" });
    const actorId = req.user?._id ?? req.user?.id;
    const result = await activityCtrl.submitReport(
        req.params.id,
        { reportUrl: req.fileUrl, reportName: req.body.reportName ?? req.file?.originalname ?? "report" },
        actorId
    );
    return res.status(result.ok ? 200 : 400).json(result);
});

module.exports = router;
