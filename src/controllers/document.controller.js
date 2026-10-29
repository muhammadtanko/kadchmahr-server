const Document = require("../models/document.model");

async function getAllDocuments() {
    try {
        const docs = await Document.find()
            .populate("uploadedBy", "firstName lastName")
            .sort({ createdAt: -1 });
        return { ok: true, payLoad: docs };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

async function createDocument({ folderId, name, fileUrl, size, ver, mimeType, uploadedBy }) {
    try {
        const doc = await Document.create({ folderId, name, fileUrl, size, ver: ver || "1", mimeType, uploadedBy });
        const populated = await doc.populate("uploadedBy", "firstName lastName");
        return { ok: true, payLoad: populated };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

module.exports = { getAllDocuments, createDocument };
