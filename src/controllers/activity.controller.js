const Activity = require("../models/activity.model");
const notifCtrl = require("./notification.controller");

const STAGES = ["Draft", "Pending dept head", "Pending admin", "Approved — pending report", "Completed", "Rejected"];

class ActivityController {
    async createActivity(data) {
        try {
            const activity = await new Activity({
                ...data,
                stage: 1,
                status: "Pending dept head",
                trail: [{ role: "owner", by: data.owner, at: new Date(), note: "Activity submitted" }],
            }).save();

            const base = { relatedId: activity._id, relatedModel: "Activity", type: "activity", page: "activities" };
            const dateStr = data.startDate
                ? new Date(data.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : "";

            // Notify HOD of the department
            await notifCtrl.notifyDeptHOD(data.department, {
                ...base,
                title: "Activity pending your approval",
                body: `"${data.title}" requires your review`,
            });

            // Notify participants (except the owner)
            const participants = Array.isArray(data.participants) ? data.participants : [];
            const reportOfficer = data.reportOfficer ? String(data.reportOfficer) : null;
            const toNotify = participants.filter(id => String(id) !== String(data.owner));

            await Promise.all(toNotify.map(id =>
                notifCtrl.notifyUser(id, {
                    ...base,
                    title: `You have been added to an activity`,
                    body: `"${data.title}"${dateStr ? " on " + dateStr : ""}${data.location ? " at " + data.location : ""}`,
                })
            ));

            // Extra notification for the report officer
            if (reportOfficer && String(reportOfficer) !== String(data.owner)) {
                await notifCtrl.notifyUser(reportOfficer, {
                    ...base,
                    title: `You are the report officer`,
                    body: `You have been assigned to submit the report for "${data.title}"`,
                });
            }

            return { ok: true, payLoad: { data: activity, message: "Activity submitted successfully" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getAllActivities() {
        try {
            const data = await Activity.find()
                .populate("owner", "firstName lastName department")
                .populate("participants", "firstName lastName")
                .populate("reportOfficer", "firstName lastName")
                .sort({ createdAt: -1 });
            return { ok: true, payLoad: { data } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getUserActivities(userId) {
        try {
            const data = await Activity.find({
                $or: [{ owner: userId }, { participants: userId }],
            }).sort({ createdAt: -1 });
            return { ok: true, payLoad: { data } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async submitReport(id, { reportUrl, reportName }, actorId) {
        try {
            const activity = await Activity.findById(id);
            if (!activity) return { ok: false, message: "Activity not found" };

            activity.reportUrl = reportUrl;
            activity.reportName = reportName || "report";
            activity.status = "Completed";
            activity.stage = 4;
            activity.trail.push({ role: "report_officer", by: actorId, at: new Date(), note: "Report submitted" });

            const updated = await activity.save();

            // Notify owner and all participants that the report is available
            const base = { relatedId: activity._id, relatedModel: "Activity", type: "activity", page: "activities" };
            const toNotify = [String(activity.owner), ...activity.participants.map(String)]
                .filter((v, i, a) => a.indexOf(v) === i)
                .filter(uid => uid !== String(actorId));

            await Promise.all(toNotify.map(uid =>
                notifCtrl.notifyUser(uid, {
                    ...base,
                    title: "Activity report submitted",
                    body: `The report for "${activity.title}" has been submitted and is now available to view`,
                })
            ));

            return { ok: true, payLoad: { data: updated, message: "Report submitted" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async updateActivity(id, updateData, actorId) {
        try {
            const activity = await Activity.findById(id);
            if (!activity) return { ok: false, message: "Activity not found" };

            const { status, note, commentText, commentBy } = updateData;

            if (commentText && commentBy) {
                activity.comments.push({ by: commentBy, text: commentText, at: new Date() });
            }

            if (status) {
                const oldStatus = activity.status;
                activity.status = status;

                // Map status to stage number
                const stageIdx = STAGES.indexOf(status);
                activity.stage = stageIdx >= 0 ? stageIdx : activity.stage;

                activity.trail.push({ role: updateData.actorRole || "System", by: actorId, at: new Date(), note: note || "" });

                // Send notifications based on new status
                const payload = {
                    relatedId: activity._id,
                    relatedModel: "Activity",
                    page: "activities",
                };

                if (status === "Pending admin") {
                    await notifCtrl.notifyRole("Admin", { ...payload, type: "activity", title: "Activity pending your approval", body: `"${activity.title}" approved by HOD — needs admin review` });
                    await notifCtrl.notifyRole("Administrator", { ...payload, type: "activity", title: "Activity pending your approval", body: `"${activity.title}" approved by HOD — needs admin review` });
                } else if (status === "Approved — pending report") {
                    await notifCtrl.notifyUser(activity.owner, { ...payload, type: "activity", title: "Activity approved", body: `"${activity.title}" has been fully approved` });
                } else if (status === "Rejected") {
                    await notifCtrl.notifyUser(activity.owner, { ...payload, type: "activity", title: "Activity rejected", body: note ? `"${activity.title}" was rejected: ${note}` : `"${activity.title}" has been rejected` });
                } else if (status === "Completed") {
                    await notifCtrl.notifyRole("Admin", { ...payload, type: "activity", title: "Activity completed", body: `"${activity.title}" has been marked as completed` });
                    await notifCtrl.notifyRole("DG", { ...payload, type: "activity", title: "Activity completed", body: `"${activity.title}" has been marked as completed` });
                }
            }

            const updated = await activity.save();
            return { ok: true, payLoad: { data: updated, message: "Activity updated" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new ActivityController();
