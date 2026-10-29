const userModel = require("../models/user.model");
const requestModel = require("../models/request.model");
const leaveModel = require("../models/leave.model");
const accountModel = require("../models/account.model");

class AnalyticsController {
    async getAnalytics() {
        try {
            const [totalUsers, totalRequests, totalLeaveRequests, accountBalances, departmentStats] = await Promise.all([
                userModel.countDocuments(),
                requestModel.countDocuments(),
                leaveModel.countDocuments(),
                accountModel.find({}, "name balance").lean(),
                userModel.aggregate([
                    { $group: { _id: "$department", count: { $sum: 1 } } },
                    { $project: { department: "$_id", count: 1, _id: 0 } },
                ]),
            ]);

            const pendingRequests = await requestModel.countDocuments({ status: "Submitted" });
            const activeUsers = await userModel.countDocuments({ status: "Active" });

            const requestsByStatus = await requestModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { status: "$_id", count: 1, _id: 0 } },
            ]);

            const totalBalance = accountBalances.reduce((sum, a) => sum + a.balance, 0);

            return {
                ok: true,
                payLoad: {
                    totalUsers,
                    activeUsers,
                    totalRequests,
                    pendingRequests,
                    totalLeaveRequests,
                    totalBalance,
                    accountBalances,
                    departmentStats: departmentStats.reduce((acc, { department, count }) => ({ ...acc, [department]: count }), {}),
                    requestsByStatus: requestsByStatus.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {}),
                },
            };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new AnalyticsController();
