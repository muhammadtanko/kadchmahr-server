const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leave.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware, async (req, res) => {
    const result = await leaveController.requestLeave(req.body);
    return res.status(result.ok ? 201 : 400).json(result);
});

router.get("/", authMiddleware, async (req, res) => {
    const result = await leaveController.getAllLeaves();
    return res.status(result.ok ? 200 : 400).json(result);
});

router.get("/status", authMiddleware, async (req, res) => {
    const statuses = req.query.status ? req.query.status.split(",") : ["Pending"];
    const result = await leaveController.getLeaveRequestsByStatus(statuses);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.get("/user/:id", authMiddleware, async (req, res) => {
    const result = await leaveController.getUserLeaves(req.params.id);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.get("/department/:dept", authMiddleware, async (req, res) => {
    const result = await leaveController.getDepartmentLeaves(req.params.dept);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.put("/:id", authMiddleware, async (req, res) => {
    const result = await leaveController.approveLeave(req.params.id, req.body);
    return res.status(result.ok ? 200 : 400).json(result);
});

module.exports = router;
