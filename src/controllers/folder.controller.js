const Folder = require("../models/folder.model");

async function getAllFolders() {
    try {
        const folders = await Folder.find().sort({ createdAt: 1 });
        return { ok: true, payLoad: folders };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

async function createFolder({ name, zone, dept, createdBy }) {
    try {
        const folder = await Folder.create({ name, zone, dept: zone === "dept" ? dept : "", createdBy });
        return { ok: true, payLoad: folder };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

module.exports = { getAllFolders, createFolder };
