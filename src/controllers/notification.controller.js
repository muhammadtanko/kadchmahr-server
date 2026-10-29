const Notification = require("../models/notification.model");
const User = require("../models/user.model");

class NotificationController {
    async _send({ recipientId, title, body, type, relatedId, relatedModel, page }) {
        return new Notification({ recipient: recipientId, title, body, type, relatedId, relatedModel, page }).save();
    }

    // Send to one user by ID
    async notifyUser(recipientId, { title, body, type, relatedId, relatedModel, page }) {
        try {
            await this._send({ recipientId, title, body, type, relatedId, relatedModel, page });
        } catch (err) {
            console.error("notifyUser error:", err.message);
        }
    }

    // Send to all users matching a role
    async notifyRole(role, { title, body, type, relatedId, relatedModel, page }) {
        try {
            const users = await User.find({ role }).select("_id");
            await Promise.all(users.map(u =>
                this._send({ recipientId: u._id, title, body, type, relatedId, relatedModel, page })
            ));
        } catch (err) {
            console.error("notifyRole error:", err.message);
        }
    }

    // Send to users matching role OR (designation + department)
    async notifyRoleOrHOD(role, department, { title, body, type, relatedId, relatedModel, page }) {
        try {
            const query = role
                ? { role }
                : { designation: "Department_Head", department };
            const users = await User.find(query).select("_id");
            await Promise.all(users.map(u =>
                this._send({ recipientId: u._id, title, body, type, relatedId, relatedModel, page })
            ));
        } catch (err) {
            console.error("notifyRoleOrHOD error:", err.message);
        }
    }

    // Send to all DG users (role === "DG" OR designation === "DG")
    async notifyDG({ title, body, type, relatedId, relatedModel, page }) {
        try {
            const users = await User.find({ $or: [{ role: 'DG' }, { designation: 'DG' }] }).select('_id');
            await Promise.all(users.map(u =>
                this._send({ recipientId: u._id, title, body, type, relatedId, relatedModel, page })
            ));
        } catch (err) {
            console.error('notifyDG error:', err.message);
        }
    }

    // Send to every active user
    async notifyAll({ title, body, type, relatedId, relatedModel, page }) {
        try {
            const users = await User.find({ status: "Active" }).select("_id");
            await Promise.all(users.map(u =>
                this._send({ recipientId: u._id, title, body, type, relatedId, relatedModel, page })
            ));
        } catch (err) {
            console.error("notifyAll error:", err.message);
        }
    }

    // Send to Department_Head of a specific department
    async notifyDeptHOD(department, { title, body, type, relatedId, relatedModel, page }) {
        try {
            const users = await User.find({ designation: "Department_Head", department }).select("_id");
            await Promise.all(users.map(u =>
                this._send({ recipientId: u._id, title, body, type, relatedId, relatedModel, page })
            ));
        } catch (err) {
            console.error("notifyDeptHOD error:", err.message);
        }
    }

    async getUserNotifications(userId) {
        try {
            const data = await Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(100);
            return { ok: true, payLoad: data };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async markRead(notifId) {
        try {
            await Notification.findByIdAndUpdate(notifId, { read: true });
            return { ok: true };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async markAllRead(userId) {
        try {
            await Notification.updateMany({ recipient: userId, read: false }, { read: true });
            return { ok: true };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new NotificationController();
