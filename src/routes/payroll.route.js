const express = require("express");
const router = express.Router();
const payrollCtrl = require("../controllers/payroll.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const notifCtrl = require("../controllers/notification.controller");

// Create a new payroll run
router.post("/", authMiddleware, async (req, res) => {
    const actorId = req.user?._id ?? req.user?.id;
    const result = await payrollCtrl.createPayroll({ ...req.body, createdBy: actorId });
    return res.status(result.ok ? 201 : 400).json(result);
});

// Get all payroll runs
router.get("/", authMiddleware, async (req, res) => {
    const result = await payrollCtrl.getAllPayroll();
    return res.status(result.ok ? 200 : 400).json(result);
});

// Advance stage or update lines
router.put("/:id", authMiddleware, async (req, res) => {
    const actorId = req.user?._id ?? req.user?.id;
    const { stage, lines, role, note } = req.body;
    const updateData = {};
    if (stage !== undefined) updateData.stage = stage;
    if (lines !== undefined) updateData.lines = lines;
    if (role !== undefined) {
        updateData.trailEntry = { role, by: actorId, at: new Date(), note: note ?? "" };
    }
    const result = await payrollCtrl.updatePayroll(req.params.id, updateData);

    if (result.ok && stage !== undefined) {
        const run = result.payLoad;
        const base = { relatedId: run._id, relatedModel: "Payroll", type: "payroll", page: "payroll" };
        if (stage === 1) {
            await notifCtrl.notifyDG({ ...base, title: "Payroll run awaiting your approval", body: `PAY-${run.period} has been reviewed by Admin and requires your approval` });
        } else if (stage === 2) {
            await notifCtrl.notifyRole("Accounts", { ...base, title: "Payroll approved — process payment", body: `PAY-${run.period} has been approved by DG. Please process payment.` });
        } else if (stage === 3) {
            const staffIds = (run.lines ?? []).map(l => String(l.uid)).filter(Boolean);
            await Promise.all(staffIds.map(uid =>
                notifCtrl.notifyUser(uid, { ...base, title: "Salary payment released", body: `Your salary for PAY-${run.period} has been processed and released to your account.` })
            ));
        }
    }

    return res.status(result.ok ? 200 : 400).json(result);
});

module.exports = router;
