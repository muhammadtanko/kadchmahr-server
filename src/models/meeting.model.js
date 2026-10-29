const mongoose = require("mongoose");
const { Schema } = mongoose;

const meetingSchema = new Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ["Management", "General", "Departmental", "External", "Committee"], required: true },
    meetingDate: { type: Date, required: true },
    time: { type: String, default: "09:00" },
    venue: { type: String, default: "" },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    minutesUrl: { type: String, default: "" },
    minutesName: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Meeting", meetingSchema);
