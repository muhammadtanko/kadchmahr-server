const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema({
    account: { type: Schema.Types.ObjectId, ref: "Account" },
    request: { type: Schema.Types.ObjectId, ref: "Request" },
    type: { type: String, enum: ["Debit", "Credit"] },
    amount: { type: Number },
    description: { type: String },
    department: { type: String },
    document: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Pending", "Declined", "Completed", "Approved"], default: "Pending" },
}, { timestamps: true, strictPopulate: false });

module.exports = mongoose.model("Transaction", transactionSchema);
