const { Schema, model } = require("mongoose");

const folderSchema = new Schema({
    name:      { type: String, required: true },
    zone:      { type: String, enum: ["org", "dept"], required: true },
    dept:      { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = model("Folder", folderSchema);
