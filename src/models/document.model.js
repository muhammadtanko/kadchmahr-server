const { Schema, model } = require("mongoose");

const documentSchema = new Schema({
    folderId:   { type: String, required: true },
    name:       { type: String, required: true },
    fileUrl:    { type: String, default: "" },
    size:       { type: Number, default: 0 },
    ver:        { type: String, default: "1" },
    mimeType:   { type: String, default: "" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = model("Document", documentSchema);
