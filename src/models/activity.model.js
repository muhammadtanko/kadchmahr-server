const mongoose = require("mongoose");
const { Schema } = mongoose;

const activitySchema = new Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ["Training", "Field", "Workshop", "Conference", "Meeting", "Monitoring", "Other"] },
    desc: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    location: { type: String },
    department: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reportOfficer: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
        type: String,
        enum: ["Draft", "Pending dept head", "Pending admin", "Approved — pending report", "Completed", "Rejected"],
        default: "Pending dept head",
    },
    stage: { type: Number, default: 1 },
    trail: [{ role: String, by: { type: Schema.Types.ObjectId, ref: "User" }, at: Date, note: String }],
    comments: [{ by: { type: Schema.Types.ObjectId, ref: "User" }, text: String, at: Date }],
    reportUrl: { type: String, default: "" },
    reportName: { type: String, default: "" },
    amount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Activity", activitySchema);
