const express = require("express");
const router = express.Router();
const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middlewares/auth.middleware");
const docCtrl = require("../controllers/document.controller");
const { cloudFlareAccessKey, cloudFlareAccountId, cloudFlareBucket, cloudFlareSecret, cloudFlareDomain } = require("../config");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
});

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${cloudFlareAccountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: cloudFlareAccessKey, secretAccessKey: cloudFlareSecret },
});

// GET all documents
router.get("/", authMiddleware, async (req, res) => {
    const result = await docCtrl.getAllDocuments();
    return res.status(result.ok ? 200 : 400).json(result);
});

// POST upload a document file
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
    const actorId = req.user?._id ?? req.user?.id;
    const { folderId, ver } = req.body;
    if (!folderId) return res.status(400).json({ ok: false, message: "folderId is required" });

    let fileUrl = "";
    const file = req.file;

    if (file) {
        const ext = file.originalname.split(".").pop();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, "0");
        const key = `documents/${folderId}/${year}/${month}/${uuidv4().replace(/-/g, "")}.${ext}`;
        try {
            await new Upload({
                client: s3Client,
                params: { Bucket: cloudFlareBucket, Key: key, Body: file.buffer, ContentType: file.mimetype },
            }).done();
            fileUrl = `${cloudFlareDomain}${key}`;
        } catch (err) {
            return res.status(500).json({ ok: false, message: "File upload failed" });
        }
    }

    const result = await docCtrl.createDocument({
        folderId,
        name: file?.originalname ?? req.body.name ?? "document",
        fileUrl,
        size: file?.size ?? 0,
        ver,
        mimeType: file?.mimetype ?? "",
        uploadedBy: actorId,
    });
    return res.status(result.ok ? 201 : 400).json(result);
});

module.exports = router;
