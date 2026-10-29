const express = require("express");
const router = express.Router();
const meetingController = require("../controllers/meeting.controller");
const notifCtrl = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { uploadFile } = require("../middlewares/upload.middleware");

// Create meeting (JSON body)
router.post("/", authMiddleware, async (req, res) => {
    const { title, type, meetingDate, time, venue, participants, createdBy } = req.body;
    if (!title || !type || !meetingDate) {
        return res.status(400).json({ ok: false, message: "title, type and meetingDate are required" });
    }
    const creatorId = createdBy ?? req.user?._id;
    const participantIds = Array.isArray(participants) ? participants : [];

    const result = await meetingController.createMeeting({
        title, type, meetingDate, time, venue,
        participants: participantIds,
        createdBy: creatorId,
    });

    if (result.ok) {
        const meeting = result.payLoad;
        const dateStr = new Date(meetingDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        const notifPayload = {
            title: `Meeting scheduled: ${title}`,
            body: `You have been added to a ${type} meeting on ${dateStr}${venue ? " at " + venue : ""}.`,
            type: "meeting",
            relatedId: meeting._id,
            relatedModel: "Meeting",
            page: "meetings",
        };
        // Notify every participant except the creator
        const toNotify = participantIds.filter(id => String(id) !== String(creatorId));
        await Promise.all(toNotify.map(id => notifCtrl.notifyUser(id, notifPayload)));
    }

    return res.status(result.ok ? 201 : 400).json(result);
});

// Get all meetings
router.get("/", authMiddleware, async (req, res) => {
    const result = await meetingController.getMeetings();
    return res.status(result.ok ? 200 : 400).json(result);
});

// Update meeting (general fields)
router.put("/:id", authMiddleware, async (req, res) => {
    const result = await meetingController.updateMeeting(req.params.id, { ...req.body });
    return res.status(result.ok ? 200 : 400).json(result);
});

// Upload meeting minutes (file → R2)
router.put("/:id/minutes", authMiddleware, uploadFile("minutes", "meetings/minutes"), async (req, res) => {
    if (!req.fileUrl) return res.status(400).json({ ok: false, message: "No file uploaded" });
    const result = await meetingController.updateMeeting(req.params.id, {
        minutesUrl: req.fileUrl,
        minutesName: req.body.minutesName ?? req.file?.originalname ?? "minutes",
    });
    return res.status(result.ok ? 200 : 400).json(result);
});

module.exports = router;
