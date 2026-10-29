const transactionModel = require("../models/transaction.model");
const accountModel = require("../models/account.model");
const accountController = require("./account.controller");
const requestModel = require("../models/request.model");

class TransactionController {
    async createPendingTransaction(request) {
        try {
            const { totalCost, _id, department, account, header } = request;
            const transaction = await new transactionModel({
                amount: totalCost, request: _id, department, account,
                description: header, type: "Debit",
            }).save();
            await accountController.registerAccountTransactions(account, transaction._id);
            return { ok: true, payLoad: { data: { transaction }, message: "Transaction created" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async debitAccount({ accountId, amount, requestId }) {
        try {
            if (amount <= 0) return { ok: false, message: "Amount must be > 0" };
            const account = await accountModel.findById(accountId);
            if (!account) return { ok: false, message: "Account not found" };
            if (account.balance < amount) return { ok: false, message: "Insufficient balance" };
            account.balance -= amount;
            await account.save();
            const transaction = await new transactionModel({
                account: accountId, request: requestId, type: "Debit", amount, status: "Completed",
            }).save();
            await accountController.registerAccountTransactions(accountId, transaction._id);
            if (requestId) {
                await requestModel.findByIdAndUpdate(requestId, { status: "Payment Completed" }, { new: true });
            }
            return { ok: true, payLoad: { data: { transaction }, message: "Debited successfully" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async creditAccount({ accountId, amount, description }) {
        try {
            if (amount <= 0) return { ok: false, message: "Amount must be > 0" };
            const account = await accountModel.findById(accountId);
            if (!account) return { ok: false, message: "Account not found" };
            account.balance += amount;
            await account.save();
            const transaction = await new transactionModel({
                account: accountId, type: "Credit", amount, description, status: "Completed",
            }).save();
            await accountController.registerAccountTransactions(accountId, transaction._id);
            return { ok: true, payLoad: { data: { transaction }, message: "Credited successfully" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async updateTransaction(id, data) {
        try {
            const transaction = await transactionModel.findByIdAndUpdate(id, data, { new: true });
            if (!transaction) return { ok: false, message: "Transaction not found" };
            return { ok: true, payLoad: { data: transaction, message: "Transaction updated" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getTransactions() {
        try {
            const transactions = await transactionModel.find().populate("account request user");
            return { ok: true, payLoad: { data: transactions } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new TransactionController();
