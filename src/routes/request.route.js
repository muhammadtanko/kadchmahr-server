const express = require("express");
const router = express.Router();
const requestController = require("../controllers/request.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { uploadFile } = require("../middlewares/upload.middleware");

router.post("/", authMiddleware, uploadFile("supportingDocument", "requests"), async (req, res) => {
    const data = { ...req.body };
    if (req.fileUrl) data.supportingDocument = req.fileUrl;
    const result = await requestController.addRequest(data);
    return res.status(result.ok ? 201 : 400).json(result);
});

router.get("/", authMiddleware, async (req, res) => {
    const result = await requestController.getRequests();
    return res.status(result.ok ? 200 : 400).json(result);
});

router.get("/status", authMiddleware, async (req, res) => {
    const statuses = req.query.status ? req.query.status.split(",") : ["Submitted"];
    const result = await requestController.getRequestsByStatus(statuses);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.get("/user/:id", authMiddleware, async (req, res) => {
    const result = await requestController.getUserRequests({ id: req.params.id });
    return res.status(result.ok ? 200 : 400).json(result);
});

router.get("/department/:dept", authMiddleware, async (req, res) => {
    const result = await requestController.getDepartmentRequest(req.params.dept);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.put("/:id", authMiddleware, uploadFile("supportingDocument", "requests"), async (req, res) => {
    const data = { ...req.body };
    if (req.fileUrl) data.supportingDocument = req.fileUrl;
    const result = await requestController.updateRequest(req.params.id, data);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.post("/:id/comment", authMiddleware, async (req, res) => {
    const result = await requestController.addComment(req.params.id, req.body);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.delete("/:id", authMiddleware, async (req, res) => {
    const result = await requestController.deleteRequest(req.params.id);
    return res.status(result.ok ? 200 : 400).json(result);
});

module.exports = router;
