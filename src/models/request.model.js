const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema({
    name: { type: String },
    comment: { type: String },
});

const requestSchema = new Schema({
    requestText: { type: String },
    header: { type: String },
    recommendation: { type: String },
    approval: { type: String },
    status: {
        type: String,
        enum: [
            "Submitted",
            "Recommended by HoD", "Rejected by HoD",
            "Approved by DG", "Rejected by DG",
            "Approved by Accounts", "Rejected by Accounts",
            "Approved by Admin", "Rejected by Admin",
            "Approved by Auditor For Pre-Audit", "Rejected by Auditor For Pre-Audit",
            "Approved by Auditor For Post-Audit", "Rejected by Auditor For Post-Audit",
            "Payment Completed",
        ],
        default: "Submitted",
    },
    totalCost: { type: Number },
    department: { type: String, enum: ["Business_Development", "ICT", "Operations", "Admin", "Accounts", "Finance/Audit", "Planning"] },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    account: { type: Schema.Types.ObjectId, ref: "Account" },
    document: { type: String },
    voucher: { type: String },
    supportingDocument: { type: String },
    comments: [commentSchema],
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
