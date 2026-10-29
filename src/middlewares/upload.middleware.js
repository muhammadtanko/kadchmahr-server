const multer = require("multer");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { v4: uuidv4 } = require("uuid");
const { cloudFlareAccessKey, cloudFlareAccountId, cloudFlareBucket, cloudFlareSecret, cloudFlareDomain } = require("../config");

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return cb(new Error("Invalid file type. Only PDF and images allowed."), false);
        }
        cb(null, true);
    },
});

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${cloudFlareAccountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: cloudFlareAccessKey,
        secretAccessKey: cloudFlareSecret,
    },
});

const uploadFile = (fieldName, folder = "uploads") => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, async (err) => {
            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({ ok: false, message: "File exceeds 10MB limit" });
                }
                return res.status(400).json({ ok: false, message: err.message });
            }
            const file = req.file;
            if (!file) return next();

            const ext = file.originalname.split(".").pop();
            const uniqueId = uuidv4().replace(/-/g, "");
            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, "0");
            const fileKey = `${folder}/${year}/${month}/${uniqueId}.${ext}`;

            try {
                const uploader = new Upload({
                    client: s3Client,
                    params: {
                        Bucket: cloudFlareBucket,
                        Key: fileKey,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    },
                });
                await uploader.done();
                req.fileUrl = `${cloudFlareDomain}${fileKey}`;
                req.fileExt = ext;
                req.fileSize = file.size;
                next();
            } catch (uploadError) {
                console.error("Upload failed:", uploadError);
                await rollbackUpload(fileKey);
                return res.status(500).json({ ok: false, message: "File upload failed" });
            }
        });
    };
};

const rollbackUpload = async (key) => {
    try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: cloudFlareBucket, Key: key }));
    } catch (err) {
        console.error("Rollback failed:", err.message);
    }
};

module.exports = { uploadFile, rollbackUpload, multerInstance: upload };
