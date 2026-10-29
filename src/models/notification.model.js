const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String },
    type: { type: String, enum: ["leave", "request", "activity", "payroll", "memo", "general"], required: true },
    relatedId: { type: Schema.Types.ObjectId },
    relatedModel: { type: String, enum: ["LeaveRequest", "Request", "Activity", "Payroll", "Memo"] },
    read: { type: Boolean, default: false },
    page: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
