const mongoose = require("mongoose");
const { Schema } = mongoose;

const leaveSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    startDate: { type: Date },
    endDate: { type: Date },
    resumption: { type: Date },
    department: { type: String },
    reason: { type: String },
    status: {
        type: String,
        enum: ["Submitted", "Approved by HOD", "Rejected by HOD", "Approved by DG", "Rejected by DG", "Approved by Admin", "Rejected by Admin"],
        default: "Submitted",
    },
    type: {
        type: String,
        enum: ["Casual Leave", "Annual Leave", "Maternity Leave", "Leave Of Absence"],
    },
}, { timestamps: true, strictPopulate: false });

module.exports = mongoose.model("LeaveRequest", leaveSchema);
