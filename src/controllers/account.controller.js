const accountModel = require("../models/account.model");

class AccountController {
    async addAccount(data) {
        try {
            const account = await new accountModel(data).save();
            return { ok: true, payLoad: { data: account, message: "Account created" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getAccounts() {
        try {
            const accounts = await accountModel.find().populate("transactions", "amount description type createdAt");
            return { ok: true, payLoad: { data: accounts } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getAccountById(id) {
        try {
            const account = await accountModel.findById(id).populate("transactions");
            if (!account) return { ok: false, message: "Account not found" };
            return { ok: true, payLoad: { data: account } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async updateAccount(id, data) {
        try {
            const account = await accountModel.findByIdAndUpdate(id, data, { new: true });
            if (!account) return { ok: false, message: "Account not found" };
            return { ok: true, payLoad: { data: account, message: "Account updated" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async deleteAccount(id) {
        try {
            const account = await accountModel.findByIdAndDelete(id);
            if (!account) return { ok: false, message: "Account not found" };
            return { ok: true, payLoad: "Account deleted" };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async registerAccountTransactions(accountId, transactionId) {
        try {
            const account = await accountModel.findByIdAndUpdate(accountId, { $push: { transactions: transactionId } }, { new: true });
            if (!account) return { ok: false, message: "Account not found" };
            return { ok: true };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new AccountController();
