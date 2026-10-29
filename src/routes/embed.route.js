const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Leave = require('../models/leave.model');
const Request = require('../models/request.model');
const Payroll = require('../models/payroll.model');
const Memo = require('../models/memo.model');
const Meeting = require('../models/meeting.model');
const Activity = require('../models/activity.model');

// Public — no auth. Returns only aggregates; no PII sent to browser.
router.get('/stats', async (req, res) => {
  try {
    const [staff, leave, requests, payroll, memos, meetings, activities] = await Promise.all([
      User.find({}).lean(),
      Leave.find({}).lean(),
      Request.find({}).lean(),
      Payroll.find({}).lean(),
      Memo.find({}).lean(),
      Meeting.find({}).lean(),
      Activity.find({}).lean(),
    ]);

    const activeStaff  = staff.filter(s => s.status === 'Active');
    const deptSet      = new Set(activeStaff.map(s => s.department).filter(Boolean));
    const REJECTED_STATUSES = ['Rejected by HoD','Rejected by DG','Rejected by Accounts','Rejected by Admin','Rejected by Auditor For Pre-Audit','Rejected by Auditor For Post-Audit'];
    const COMPLETED_STATUS  = 'Payment Completed';
    const pending   = requests.filter(r => !REJECTED_STATUSES.includes(r.status) && r.status !== COMPLETED_STATUS && r.status !== 'Submitted');
    const completed = requests.filter(r => r.status === COMPLETED_STATUS);
    const rejected  = requests.filter(r => REJECTED_STATUSES.includes(r.status));
    const pendingLeave = leave.filter(l => l.status === 'Pending');

    const sorted = [...payroll].sort((a, b) => (b.period || '').localeCompare(a.period || ''));
    const latest = sorted[0];
    const latestTotal = latest?.lines?.reduce((a, l) => a + (l.gross || 0), 0) ?? 0;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = meetings
      .filter(m => m.date && new Date(m.date) >= today)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .slice(0, 3)
      .map(m => ({ id: m._id, title: m.title, date: m.date, time: m.time, venue: m.venue }));

    const byDept = [...deptSet].map(d => ({
      dept: d,
      count: activeStaff.filter(s => s.department === d).length,
    })).sort((a, b) => b.count - a.count);

    res.json({
      staff:    { total: staff.length, active: activeStaff.length, depts: deptSet.size, byDept },
      requests: {
        total: requests.length,
        pending: pending.length,
        completed: completed.length,
        rejected: rejected.length,
        pendingValue: pending.reduce((a, r) => a + (r.totalCost || 0), 0),
        completedValue: completed.reduce((a, r) => a + (r.totalCost || 0), 0),
      },
      leave:    { total: leave.length, pending: pendingLeave.length },
      payroll:  latest ? { period: latest.period, stage: latest.stage, total: latestTotal, staffCount: latest.lines?.length ?? 0 } : null,
      memos:    memos.length,
      meetings: { total: meetings.length, upcoming },
      activities: activities.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
