const leaveModel = require("../models/leave.model");
const userController = require("./user.controller");
const notifCtrl = require("./notification.controller");

class LeaveController {
    async requestLeave(data) {
        try {
            const leave = await new leaveModel(data).save();
            await userController.registerUserLeave(data.user, leave._id);

            // Notify HOD of the applicant's department
            await notifCtrl.notifyDeptHOD(data.department, {
                title: "Leave request pending your approval",
                body: `A ${data.type} request requires your review`,
                type: "leave",
                relatedId: leave._id,
                relatedModel: "LeaveRequest",
                page: "leave",
            });

            return { ok: true, payLoad: { data: leave, message: "Leave applied successfully" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getAllLeaves() {
        try {
            const data = await leaveModel.find().populate({ path: "user", model: "User" }).sort({ createdAt: -1 });
            return { ok: true, payLoad: data };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getUserLeaves(id) {
        try {
            const data = await leaveModel.find({ user: id }).sort({ createdAt: -1 });
            return { ok: true, payLoad: data };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getDepartmentLeaves(dept) {
        try {
            const data = await leaveModel.find({ department: dept }).populate("user", "firstName lastName").sort({ createdAt: -1 });
            return { ok: true, payLoad: data };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async approveLeave(id, updateData) {
        try {
            const leave = await leaveModel.findById(id).populate("user", "_id firstName lastName");
            if (!leave) return { ok: false, message: "Leave not found" };

            const { status, note } = updateData;
            leave.status = status;
            const updated = await leave.save();

            const payload = {
                type: "leave",
                relatedId: leave._id,
                relatedModel: "LeaveRequest",
                page: "leave",
            };

            if (status === "Approved by HOD") {
                await notifCtrl.notifyDG({ ...payload, title: "Leave request pending DG approval", body: `${leave.type} request has been recommended by HOD` });
            } else if (status === "Approved by DG") {
                await notifCtrl.notifyRole("Admin", { ...payload, title: "Leave request pending Admin approval", body: `${leave.type} request approved by DG — needs Admin sign-off` });
                await notifCtrl.notifyRole("Administrator", { ...payload, title: "Leave request pending Admin approval", body: `${leave.type} request approved by DG — needs Admin sign-off` });
            } else if (status === "Approved by Admin") {
                await notifCtrl.notifyUser(leave.user._id, { ...payload, title: "Leave approved", body: `Your ${leave.type} request has been fully approved` });
            } else if (status.startsWith("Rejected")) {
                await notifCtrl.notifyUser(leave.user._id, { ...payload, title: "Leave request rejected", body: note ? `Your ${leave.type} request was rejected: ${note}` : `Your ${leave.type} request was rejected` });
            }

            return { ok: true, payLoad: updated };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getLeaveRequestsByStatus(statuses) {
        try {
            const requests = await leaveModel.find({ status: { $in: statuses } }).populate("user", "firstName lastName");
            return { ok: true, payLoad: { data: requests } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new LeaveController();
