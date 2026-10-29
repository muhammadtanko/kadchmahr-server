const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { uploadFile } = require("../middlewares/upload.middleware");

router.post("/register", async (req, res) => {
    const result = await userController.registerUser(req.body);
    return res.status(result.ok ? 201 : 400).json(result);
});

router.post("/login", async (req, res) => {
    const result = await userController.loginUser(req.body);
    return res.status(result.ok ? 200 : 401).json(result);
});

router.get("/", /* authMiddleware, */ async (req, res) => {
    const result = await userController.getUsers();
    return res.status(result.ok ? 200 : 400).json(result);
});

router.get("/department/:dept", authMiddleware, async (req, res) => {
    const result = await userController.getDepartmentUsers(req.params.dept);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.get("/:id", authMiddleware, async (req, res) => {
    const result = await userController.getUser(req.params.id);
    return res.status(result.ok ? 200 : 404).json(result);
});

router.put("/:id", /* authMiddleware, */ async (req, res) => {
    const result = await userController.updateUser(req.params.id, req.body);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.post("/bulk-upload", authMiddleware, uploadFile("file"), async (req, res) => {
    try {
        const jsonData = JSON.parse(req.body.data || "[]");
        const result = await userController.bulkUploadUsers(jsonData);
        return res.status(result.ok ? 201 : 400).json(result);
    } catch (err) {
        return res.status(400).json({ ok: false, message: "Invalid JSON data" });
    }
});

module.exports = router;
