const mongoose = require("mongoose");
const { Schema } = mongoose;

const memoSchema = new Schema({
    type:      { type: String, enum: ["Internal", "External"], required: true },
    subject:   { type: String, required: true },
    body:      { type: String, default: "" },
    org:       { type: String, default: "" },
    received:  { type: Date },
    fileUrl:   { type: String, default: "" },
    fileName:  { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Memo", memoSchema);
