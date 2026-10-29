const requestModel = require("../models/request.model");
const transactionController = require("./transaction.controller");
const notifCtrl = require("./notification.controller");

class RequestController {
    async addRequest(data) {
        try {
            const request = await new requestModel(data).save();

            // Notify HOD of the request's department
            if (data.department) {
                await notifCtrl.notifyDeptHOD(data.department, {
                    title: "Financial request pending your recommendation",
                    body: `New request: "${data.header || data.requestText?.slice(0, 60)}"`,
                    type: "request",
                    relatedId: request._id,
                    relatedModel: "Request",
                    page: "requests",
                });
            }

            return { ok: true, payLoad: { data: request, message: "Request submitted successfully" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getRequests() {
        try {
            const requests = await requestModel.find().populate("user", "firstName lastName department").populate("account", "name balance");
            return { ok: true, payLoad: { data: requests } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getUserRequests({ id }) {
        try {
            const requests = await requestModel.find({ user: id });
            return { ok: true, payLoad: { data: requests } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getDepartmentRequest(dept) {
        try {
            const requests = await requestModel.find({ department: dept }).populate("user", "firstName lastName");
            return { ok: true, payLoad: { data: requests } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getRequestsByStatus(statuses) {
        try {
            const requests = await requestModel.find({ status: { $in: statuses } }).populate("account");
            return { ok: true, payLoad: { data: requests } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async addComment(requestId, data) {
        try {
            const request = await requestModel.findById(requestId);
            if (!request) return { ok: false, message: "Request not found" };
            request.comments.push(data);
            const updated = await request.save();
            return { ok: true, payLoad: { data: updated, message: "Comment added" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async updateRequest(id, data) {
        try {
            const { recommendation, approval, status, account, supportingDocument, totalCost, comments, note } = data;
            const request = await requestModel.findById(id).populate("user", "_id");
            if (!request) return { ok: false, message: "Request not found" };
            if (recommendation) request.recommendation = recommendation;
            if (approval) request.approval = approval;
            if (status) request.status = status;
            if (account) request.account = account;
            if (supportingDocument) request.supportingDocument = supportingDocument;
            if (totalCost) request.totalCost = totalCost;
            if (comments) request.comments.push(comments);
            const updated = await request.save();

            // Notifications — flow: HoD → Admin → Auditor(pre) → DG → Accounts → Auditor(post)
            if (status) {
                const nPayload = { type: "request", relatedId: request._id, relatedModel: "Request", page: "requests" };
                const requestTitle = request.header || "Financial request";

                if (status === "Recommended by HoD") {
                    await notifCtrl.notifyRole("Admin", { ...nPayload, title: "Request needs your approval", body: `"${requestTitle}" recommended by HoD` });
                    await notifCtrl.notifyRole("Administrator", { ...nPayload, title: "Request needs your approval", body: `"${requestTitle}" recommended by HoD` });
                } else if (status === "Approved by Admin") {
                    await notifCtrl.notifyRole("Auditor", { ...nPayload, title: "Request pending pre-audit", body: `"${requestTitle}" approved by Admin — pre-audit required` });
                } else if (status === "Approved by Auditor For Pre-Audit") {
                    await notifCtrl.notifyRole("DG", { ...nPayload, title: "Request pending DG approval", body: `"${requestTitle}" has passed pre-audit` });
                } else if (status === "Approved by DG") {
                    await notifCtrl.notifyRole("Accounts", { ...nPayload, title: "Request ready for payment processing", body: `"${requestTitle}" approved by DG` });
                    await transactionController.createPendingTransaction(updated).catch(() => {});
                } else if (status === "Approved by Accounts") {
                    await notifCtrl.notifyRole("Auditor", { ...nPayload, title: "Request pending post-audit", body: `"${requestTitle}" payment processed — post-audit required` });
                } else if (status === "Approved by Auditor For Post-Audit" || status === "Payment Completed") {
                    if (request.user?._id) {
                        await notifCtrl.notifyUser(request.user._id, { ...nPayload, title: "Payment completed", body: `Your request "${requestTitle}" has been fully processed` });
                    }
                } else if (status.startsWith("Rejected")) {
                    if (request.user?._id) {
                        await notifCtrl.notifyUser(request.user._id, { ...nPayload, title: "Request rejected", body: note ? `"${requestTitle}" was rejected: ${note}` : `"${requestTitle}" has been rejected` });
                    }
                }
            }

            return { ok: true, payLoad: { data: updated, message: "Request updated" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async deleteRequest(id) {
        try {
            const request = await requestModel.findByIdAndDelete(id);
            if (!request) return { ok: false, message: "Request not found" };
            return { ok: true, payLoad: "Request deleted" };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new RequestController();
