const express = require('express');
const router = express.Router();
const User     = require('../models/user.model');
const Leave    = require('../models/leave.model');
const Request  = require('../models/request.model');
const Payroll  = require('../models/payroll.model');
const Memo     = require('../models/memo.model');
const Meeting  = require('../models/meeting.model');
const Activity = require('../models/activity.model');
const Account  = require('../models/account.model');

// ── helpers ────────────────────────────────────────────────────────────────────
const REJECTED = new Set([
  'Rejected by HoD','Rejected by DG','Rejected by Accounts','Rejected by Admin',
  'Rejected by Auditor For Pre-Audit','Rejected by Auditor For Post-Audit',
]);
const COMPLETED = 'Payment Completed';

// ── GET /api/v1/embed/stats ─── lightweight aggregates only (for the old widget) ──
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
    const pending      = requests.filter(r => !REJECTED.has(r.status) && r.status !== COMPLETED && r.status !== 'Submitted');
    const completed    = requests.filter(r => r.status === COMPLETED);
    const rejected     = requests.filter(r => REJECTED.has(r.status));
    const pendingLeave = leave.filter(l => l.status === 'Pending' || l.status === 'Submitted');
    const sorted       = [...payroll].sort((a, b) => (b.period || '').localeCompare(a.period || ''));
    const latest       = sorted[0];
    const latestTotal  = latest?.lines?.reduce((a, l) => a + (l.gross || 0), 0) ?? 0;
    const today        = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming     = meetings
      .filter(m => m.meetingDate && new Date(m.meetingDate) >= today)
      .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate))
      .slice(0, 3)
      .map(m => ({ id: m._id, title: m.title, date: new Date(m.meetingDate).toISOString().slice(0, 10), time: m.time, venue: m.venue }));
    const byDept = [...deptSet].map(d => ({
      dept: d.replace(/_/g, ' '), count: activeStaff.filter(s => s.department === d).length,
    })).sort((a, b) => b.count - a.count);

    res.json({
      staff:    { total: staff.length, active: activeStaff.length, depts: deptSet.size, byDept },
      requests: { total: requests.length, pending: pending.length, completed: completed.length, rejected: rejected.length, pendingValue: pending.reduce((a, r) => a + (r.totalCost || 0), 0), completedValue: completed.reduce((a, r) => a + (r.totalCost || 0), 0) },
      leave:    { total: leave.length, pending: pendingLeave.length },
      payroll:  latest ? { period: latest.period, stage: latest.stage, total: latestTotal, staffCount: latest.lines?.length ?? 0 } : null,
      memos: memos.length, meetings: { total: meetings.length, upcoming }, activities: activities.length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/v1/embed/all ─── full data for the dashboard replica ──────────────
// Public — no auth. Staff objects strip all sensitive personal fields.
router.get('/all', async (req, res) => {
  try {
    const [staff, leave, requests, payroll, memos, meetings, activities, accounts] = await Promise.all([
      User.find({}).lean(),
      Leave.find({}).lean(),
      Request.find({}).populate('user', 'firstName middleName lastName').lean(),
      Payroll.find({}).lean(),
      Memo.find({}).populate('createdBy', 'firstName middleName lastName').lean(),
      Meeting.find({}).lean(),
      Activity.find({}).lean(),
      Account.find({}).lean(),
    ]);

    // Map staff — omit sensitive fields
    const mappedStaff = staff.map(u => {
      const name = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ');
      return {
        id: String(u._id),
        name,
        dept: (u.department ?? '').replace(/_/g, ' '),
        des: u.designation ?? 'Staff',
        role: u.role ?? 'User',
        appt: u.ApptType ?? 'Permanent',
        status: u.status ?? 'Active',
        joined: u.employmentDate ? new Date(u.employmentDate).toISOString().slice(0, 10) : '',
        gender: u.gender ?? '',
        rank: u.gradeLevel ?? '',
        gross: u.gross ?? 30000,
      };
    });

    // Map leave
    const mappedLeave = leave.map(l => ({
      id: String(l._id),
      who: l.user ? String(l.user) : '',
      type: l.type ?? '',
      from: l.startDate ? new Date(l.startDate).toISOString().slice(0, 10) : '',
      to: l.endDate ? new Date(l.endDate).toISOString().slice(0, 10) : '',
      department: l.department ?? '',
      reason: l.reason ?? '',
      status: l.status ?? 'Submitted',
      created: l.createdAt ?? '',
      trail: (l.trail ?? []).map(t => ({ role: t.role ?? '', at: t.at ? new Date(t.at).toISOString() : '', note: t.note ?? '' })),
    }));

    // Map requests — derive stage/rejected from status for Dashboard.jsx compatibility
    const STATUS_TO_STAGE = {
      'Submitted': 0,
      'Recommended by HoD': 1,
      'Approved by DG': 2,
      'Approved by Accounts': 3,
      'Approved by Admin': 4,
      'Approved by Auditor For Pre-Audit': 5,
      'Approved by Auditor For Post-Audit': 6,
      'Payment Completed': 8,
    };
    const mappedRequests = requests.map(r => {
      const status = r.status ?? 'Submitted';
      const isRejected = REJECTED.has(status);
      const stage = isRejected ? 0 : (STATUS_TO_STAGE[status] ?? 0);
      const owner = r.user;
      return {
        id: String(r._id),
        owner: owner ? (typeof owner === 'object' ? String(owner._id) : String(owner)) : '',
        head: r.header ?? '',
        header: r.header ?? '',
        requestText: r.requestText ?? '',
        amount: r.totalCost ?? 0,
        totalCost: r.totalCost ?? 0,
        department: r.department ?? '',
        status,
        stage,
        rejected: isRejected,
        trail: [],
        comments: (r.comments ?? []).map(c => ({ by: c.name ?? '', text: c.comment ?? '', at: '' })),
      };
    });

    // Map payroll
    const mappedPayroll = payroll.map(p => ({
      id: String(p._id),
      period: p.period ?? '',
      stage: p.stage ?? 0,
      lines: (p.lines ?? []).map(l => ({
        uid: l.uid ? String(l.uid) : '',
        name: l.name ?? '',
        dept: l.dept ?? '',
        gross: l.gross ?? 0,
      })),
      trail: (p.trail ?? []).map(t => ({ role: t.role ?? '', at: t.at ? new Date(t.at).toISOString() : '', note: t.note ?? '' })),
    }));

    // Map memos
    const mappedMemos = memos.map(m => {
      const cb = m.createdBy;
      const createdByName = cb && typeof cb === 'object'
        ? [cb.firstName, cb.middleName, cb.lastName].filter(Boolean).join(' ')
        : '';
      return {
        id: String(m._id),
        type: m.type ?? 'Internal',
        subject: m.subject ?? '',
        body: m.body ?? '',
        org: m.org ?? '',
        at: m.createdAt ?? '',
        createdBy: { id: cb ? String(cb._id ?? cb) : '', name: createdByName },
      };
    });

    // Map meetings
    const mappedMeetings = meetings.map(m => ({
      id: String(m._id),
      title: m.title ?? '',
      type: m.type ?? 'General',
      date: m.meetingDate ? new Date(m.meetingDate).toISOString().slice(0, 10) : '',
      time: m.time ?? '',
      venue: m.venue ?? '',
      participants: (m.participants ?? []).map(p => typeof p === 'object' ? String(p._id ?? p) : String(p)),
      createdBy: m.createdBy ? String(m.createdBy) : null,
    }));

    // Map activities
    const mappedActivities = activities.map(a => ({
      id: String(a._id),
      title: a.title ?? '',
      type: a.type ?? '',
      startDate: a.startDate ? new Date(a.startDate).toISOString().slice(0, 10) : '',
      endDate: a.endDate ? new Date(a.endDate).toISOString().slice(0, 10) : '',
      location: a.location ?? '',
      owner: a.owner ? String(a.owner) : '',
      participants: (a.participants ?? []).map(p => typeof p === 'object' ? String(p._id ?? p) : String(p)),
      stage: a.stage ?? 1,
      status: a.status ?? '',
      trail: (a.trail ?? []).map(t => ({ role: t.role ?? '', at: t.at ? new Date(t.at).toISOString() : '', note: t.note ?? '' })),
      amount: a.amount ?? 0,
    }));

    // Map accounts — use backend data if available, else empty (frontend merges with mock)
    const mappedAccounts = accounts.map(a => ({
      name: a.name ?? '',
      bal: a.balance ?? 0,
      subs: [],
    }));

    res.json({
      staff: mappedStaff,
      leave: mappedLeave,
      requests: mappedRequests,
      payroll: mappedPayroll,
      memos: mappedMemos,
      meetings: mappedMeetings,
      activities: mappedActivities,
      accounts: mappedAccounts,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
