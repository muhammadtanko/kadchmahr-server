const Memo = require("../models/memo.model");
const notifCtrl = require("./notification.controller");

class MemoController {
    async createMemo({ type, subject, body, org, received, fileUrl, fileName, createdBy }) {
        try {
            const memo = await new Memo({
                type, subject,
                body: body ?? "",
                org: org ?? "",
                received: received ? new Date(received) : undefined,
                fileUrl: fileUrl ?? "",
                fileName: fileName ?? "",
                createdBy,
            }).save();

            const base = { relatedId: memo._id, relatedModel: "Memo", type: "memo", page: "memos" };
            await notifCtrl.notifyAll({
                ...base,
                title: `New ${type.toLowerCase()} memo: ${subject}`,
                body: type === "External"
                    ? `An external memo from ${org || "unknown organisation"} has been uploaded.`
                    : `A new internal memo has been issued: "${subject}"`,
            });

            return { ok: true, payLoad: memo };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getAllMemos() {
        try {
            const memos = await Memo.find()
                .populate("createdBy", "firstName lastName")
                .sort({ createdAt: -1 });
            return { ok: true, payLoad: memos };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new MemoController();
