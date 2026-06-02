const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Team = require('../models/Team');
const ApiError = require('../utils/apiError');
const { getExecutiveIdsForLeader } = require('./teamScopeService');

/** Roles that must check in daily (admin & sales_manager excluded). */
const CHECK_IN_ROLES = [
  'team_leader',
  'sales_executive',
  'accountant',
  'operations_manager',
];

const TRACKED_ROLES = [...CHECK_IN_ROLES];

const ORG_TZ = process.env.ATTENDANCE_TZ || 'Asia/Kolkata';
const LATE_HOUR = Number(process.env.ATTENDANCE_LATE_HOUR ?? 10);
const LATE_MINUTE = Number(process.env.ATTENDANCE_LATE_MINUTE ?? 15);

function calendarParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ORG_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  const d = parts.find((p) => p.type === 'day').value;
  return { y, m, d, key: `${y}-${m}-${d}` };
}

/** Start of calendar day in org timezone (stored as Date). */
function startOfCalendarDay(date = new Date()) {
  const { y, m, d } = calendarParts(date);
  return new Date(`${y}-${m}-${d}T00:00:00+05:30`);
}

function endOfCalendarDay(date = new Date()) {
  const { y, m, d } = calendarParts(date);
  return new Date(`${y}-${m}-${d}T23:59:59.999+05:30`);
}

function timePartsInOrg(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ORG_TZ,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour').value);
  const minute = Number(parts.find((p) => p.type === 'minute').value);
  return { hour, minute };
}

function deriveStatus(checkIn) {
  const { hour, minute } = timePartsInOrg(checkIn);
  if (hour > LATE_HOUR || (hour === LATE_HOUR && minute > LATE_MINUTE)) {
    return 'late';
  }
  return 'present';
}

function computeTotalHours(checkIn, checkOut) {
  const ms = new Date(checkOut) - new Date(checkIn);
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
}

function formatRecord(doc, userMap) {
  const u = userMap?.get(doc.userId?.toString()) || doc.userId;
  return {
    id: doc._id,
    userId: doc.userId?._id || doc.userId,
    userName: u?.name || 'Unknown',
    userEmail: u?.email,
    userRole: u?.role,
    date: doc.date,
    checkIn: doc.checkIn,
    checkOut: doc.checkOut,
    totalHours: doc.totalHours,
    workMode: doc.workMode,
    status: doc.status,
    isAutoCheckout: doc.isAutoCheckout,
    isOnline: !doc.checkOut,
    createdAt: doc.createdAt,
  };
}

async function buildUserMap(userIds) {
  const users = await User.find({ _id: { $in: userIds } })
    .select('name email role')
    .lean();
  return new Map(users.map((u) => [u._id.toString(), u]));
}

async function getScopedUserIds(user, branchId = null) {
  if (user.role === 'admin') {
    const users = await User.find({
      role: { $in: TRACKED_ROLES },
      status: 'active',
      ...(branchId ? { branchId } : {}),
    })
      .select('_id')
      .lean();
    return users.map((u) => u._id.toString());
  }

  if (user.role === 'sales_manager') {
    const teams = await Team.find({
      salesManager: user._id,
      ...(branchId ? { branchId } : {}),
    }).lean();
    const ids = new Set();
    for (const team of teams) {
      if (team.teamLeader) ids.add(team.teamLeader.toString());
      team.members?.forEach((m) => ids.add(m.toString()));
    }
    if (!ids.size) {
      const allTeams = await Team.find(branchId ? { branchId } : {}).lean();
      for (const team of allTeams) {
        if (team.teamLeader) ids.add(team.teamLeader.toString());
        team.members?.forEach((m) => ids.add(m.toString()));
      }
    }
    return [...ids].filter((id) => id !== user._id.toString());
  }

  if (user.role === 'team_leader') {
    const memberIds = await getExecutiveIdsForLeader(user._id);
    return [user._id.toString(), ...memberIds];
  }

  return [user._id.toString()];
}

async function getTodayStatus(userId) {
  const user = await User.findById(userId).select('role branchId').lean();
  const requiresCheckIn = CHECK_IN_ROLES.includes(user?.role);
  const dayStart = startOfCalendarDay();
  const record = await Attendance.findOne({
    userId,
    date: dayStart,
    ...(user?.branchId ? { branchId: user.branchId } : {}),
  }).lean();

  return {
    date: dayStart,
    requiresCheckIn,
    checkedIn: Boolean(record),
    checkedOut: Boolean(record?.checkOut),
    record: record ? formatRecord(record) : null,
    canCheckIn: requiresCheckIn && !record,
    canCheckOut: requiresCheckIn && Boolean(record && !record.checkOut),
  };
}

async function checkIn(userId, workMode) {
  if (!['office', 'wfh'].includes(workMode)) {
    throw new ApiError(400, 'workMode must be office or wfh');
  }

  const user = await User.findById(userId);
  if (!user || user.status !== 'active') {
    throw new ApiError(400, 'User is not active');
  }
  if (!CHECK_IN_ROLES.includes(user.role)) {
    throw new ApiError(403, 'Attendance check-in is not required for your role');
  }

  const dayStart = startOfCalendarDay();
  const existing = await Attendance.findOne({ userId, date: dayStart });
  if (existing) {
    throw new ApiError(409, 'You have already checked in today');
  }

  const now = new Date();
  const record = await Attendance.create({
    userId,
    branchId: user.branchId || null,
    date: dayStart,
    checkIn: now,
    workMode,
    status: deriveStatus(now),
    isAutoCheckout: false,
  });

  return formatRecord(record.toObject());
}

async function checkOut(userId) {
  const user = await User.findById(userId).select('role');
  if (!user || !CHECK_IN_ROLES.includes(user.role)) {
    throw new ApiError(403, 'Attendance check-out is not required for your role');
  }

  const dayStart = startOfCalendarDay();
  const record = await Attendance.findOne({ userId, date: dayStart });
  if (!record) throw new ApiError(400, 'No check-in found for today');
  if (record.checkOut) throw new ApiError(400, 'Already checked out for today');

  const now = new Date();
  record.checkOut = now;
  record.totalHours = computeTotalHours(record.checkIn, now);
  record.isAutoCheckout = false;
  await record.save();

  return formatRecord(record.toObject());
}

async function getMyHistory(userId, limit = 30) {
  const records = await Attendance.find({ userId })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
  const userMap = await buildUserMap([userId]);
  return records.map((r) => formatRecord(r, userMap));
}

async function buildTodaySummary(viewer, branchId = null) {
  const dayStart = startOfCalendarDay();
  const dayEnd = endOfCalendarDay();
  const scopedIds = await getScopedUserIds(viewer, branchId);
  const scopedObjectIds = scopedIds;

  const [records, scopedUsers] = await Promise.all([
    Attendance.find({
      userId: { $in: scopedObjectIds },
      date: dayStart,
      ...(branchId ? { branchId } : {}),
    })
      .sort({ checkIn: -1 })
      .lean(),
    User.find({
      _id: { $in: scopedObjectIds },
      status: 'active',
      ...(branchId ? { branchId } : {}),
    })
      .select('name email role')
      .lean(),
  ]);

  const userMap = new Map(scopedUsers.map((u) => [u._id.toString(), u]));
  const formatted = records.map((r) => formatRecord(r, userMap));

  const checkedInIds = new Set(records.map((r) => r.userId.toString()));
  const present = formatted.filter((r) => r.status === 'present').length;
  const late = formatted.filter((r) => r.status === 'late').length;
  const officeUsers = formatted.filter((r) => r.workMode === 'office');
  const wfhUsers = formatted.filter((r) => r.workMode === 'wfh');
  const onlineUsers = formatted.filter((r) => r.isOnline);
  const absent = scopedUsers.filter((u) => !checkedInIds.has(u._id.toString()));

  const myStatus = await getTodayStatus(viewer._id);

  return {
    date: dayStart,
    timezone: ORG_TZ,
    summary: {
      presentToday: present,
      absentToday: absent.length,
      lateToday: late,
      officeCount: officeUsers.length,
      wfhCount: wfhUsers.length,
      onlineCount: onlineUsers.length,
      totalScoped: scopedUsers.length,
    },
    officeUsers,
    wfhUsers,
    lateUsers: formatted.filter((r) => r.status === 'late'),
    onlineUsers,
    absentUsers: absent.map((u) => ({
      userId: u._id,
      userName: u.name,
      userEmail: u.email,
      userRole: u.role,
    })),
    teamAttendance: formatted,
    myStatus,
  };
}

module.exports = {
  CHECK_IN_ROLES,
  TRACKED_ROLES,
  checkIn,
  checkOut,
  getTodayStatus,
  getMyHistory,
  buildTodaySummary,
  startOfCalendarDay,
};
