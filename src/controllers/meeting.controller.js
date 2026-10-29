const meetingModel = require("../models/meeting.model");

class MeetingController {
    async createMeeting(data) {
        try {
            const meeting = await new meetingModel(data).save();
            await meeting.populate([
                { path: "participants", select: "firstName lastName email" },
                { path: "createdBy", select: "firstName lastName email" },
            ]);
            return { ok: true, payLoad: meeting };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getMeetings() {
        try {
            const meetings = await meetingModel
                .find()
                .populate("participants", "firstName lastName email")
                .populate("createdBy", "firstName lastName email")
                .sort({ meetingDate: 1 });
            return { ok: true, payLoad: meetings };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async updateMeeting(id, data) {
        try {
            delete data._id; delete data.__v; delete data.createdAt; delete data.updatedAt;
            const meeting = await meetingModel
                .findByIdAndUpdate(id, { $set: data }, { new: true })
                .populate("participants", "firstName lastName email")
                .populate("createdBy", "firstName lastName email");
            if (!meeting) return { ok: false, message: "Meeting not found" };
            return { ok: true, payLoad: meeting };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new MeetingController();
