const mongoose = require("mongoose");
const { Schema } = mongoose;

const accountSchema = new Schema({
    name: { type: String, required: true, unique: true },
    bank: { type: String, default: "" },
    balance: { type: Number, default: 0 },
    transactions: [{ type: mongoose.Types.ObjectId, ref: "Transaction" }],
}, { timestamps: true, strictPopulate: false });

module.exports = mongoose.model("Account", accountSchema);
