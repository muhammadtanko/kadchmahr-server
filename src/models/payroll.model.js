const mongoose = require("mongoose");
const { Schema } = mongoose;

const lineSchema = new Schema({
    uid:   { type: Schema.Types.ObjectId, ref: "User" },
    name:  { type: String, default: "" },
    dept:  { type: String, default: "" },
    des:   { type: String, default: "" },
    rank:  { type: String, default: "" },
    gross: { type: Number, default: 0 },
}, { _id: false });

const payrollSchema = new Schema({
    period: { type: String, required: true, unique: true },
    stage:  { type: Number, default: 0 },
    lines:  [lineSchema],
    trail:  [{ role: String, by: { type: Schema.Types.ObjectId, ref: "User" }, at: Date, note: String }],
}, { timestamps: true });

module.exports = mongoose.model("Payroll", payrollSchema);
