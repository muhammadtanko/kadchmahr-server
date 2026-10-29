const Payroll = require("../models/payroll.model");

class PayrollController {
    async createPayroll({ period, lines, trail, createdBy }) {
        try {
            if (!period) return { ok: false, message: "period is required" };
            const existing = await Payroll.findOne({ period });
            if (existing) return { ok: false, message: "A run for this period already exists" };

            const payroll = await new Payroll({ period, stage: 0, lines: lines ?? [], trail: trail ?? [] }).save();
            return { ok: true, payLoad: payroll };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getAllPayroll() {
        try {
            const data = await Payroll.find().sort({ period: -1 });
            return { ok: true, payLoad: data };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async updatePayroll(id, updateData) {
        try {
            const payroll = await Payroll.findById(id);
            if (!payroll) return { ok: false, message: "Payroll run not found" };

            if (updateData.stage !== undefined) payroll.stage = updateData.stage;
            if (updateData.lines !== undefined) payroll.lines = updateData.lines;
            if (updateData.trailEntry) payroll.trail.push(updateData.trailEntry);

            const updated = await payroll.save();
            return { ok: true, payLoad: updated };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new PayrollController();
