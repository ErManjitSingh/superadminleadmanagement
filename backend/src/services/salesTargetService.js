const MonthlySalesTarget = require('../models/MonthlySalesTarget');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { getExecutiveIdsForLeader } = require('./teamScopeService');

const DEFAULT_TARGETS = {
  sales_executive: 1500000,
  team_leader: 3500000,
};

function currentPeriod(date = new Date()) {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

async function getMonthlyTarget(userId, { year, month } = currentPeriod()) {
  const row = await MonthlySalesTarget.findOne({ userId, year, month }).lean();
  if (row) return row.revenueTarget;
  const user = await User.findById(userId).select('role').lean();
  return DEFAULT_TARGETS[user?.role] || DEFAULT_TARGETS.sales_executive;
}

async function assertCanSetTarget(req, targetUserId) {
  const targetUser = await User.findById(targetUserId).select('role branchId').lean();
  if (!targetUser) throw new ApiError(404, 'User not found');

  if (req.user.role === 'admin' || req.user.role === 'sales_manager') {
    if (!['sales_executive', 'team_leader'].includes(targetUser.role)) {
      throw new ApiError(400, 'Targets can only be set for sales executives and team leaders');
    }
    return targetUser;
  }

  if (req.user.role === 'team_leader') {
    if (targetUser.role !== 'sales_executive') {
      throw new ApiError(403, 'Team leaders can only set targets for sales executives');
    }
    const execIds = await getExecutiveIdsForLeader(req.user._id);
    if (!execIds.includes(String(targetUserId))) {
      throw new ApiError(403, 'This executive is not on your team');
    }
    return targetUser;
  }

  throw new ApiError(403, 'You do not have permission to set sales targets');
}

async function setMonthlyTarget(req, { userId, revenueTarget, year, month, notes }) {
  const period = year && month ? { year: Number(year), month: Number(month) } : currentPeriod();
  const amount = Number(revenueTarget);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new ApiError(400, 'Valid revenue target is required');
  }

  const targetUser = await assertCanSetTarget(req, userId);

  const doc = await MonthlySalesTarget.findOneAndUpdate(
    { userId, year: period.year, month: period.month },
    {
      userId,
      year: period.year,
      month: period.month,
      revenueTarget: amount,
      branchId: targetUser.branchId || req.branchId || null,
      setBy: req.user._id,
      setByName: req.user.name,
      notes: notes?.trim() || '',
    },
    { upsert: true, new: true }
  ).lean();

  return doc;
}

async function listTargetsForManager(req, { year, month } = currentPeriod()) {
  const period = { year: Number(year), month: Number(month) };
  const users = await User.find({
    role: { $in: ['sales_executive', 'team_leader'] },
    status: 'active',
    ...(req.branchId ? { branchId: req.branchId } : {}),
  })
    .select('name email role')
    .lean();

  const targets = await MonthlySalesTarget.find({
    userId: { $in: users.map((u) => u._id) },
    year: period.year,
    month: period.month,
  }).lean();

  const map = Object.fromEntries(targets.map((t) => [String(t.userId), t]));

  return users.map((u) => ({
    userId: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    revenueTarget: map[String(u._id)]?.revenueTarget ?? DEFAULT_TARGETS[u.role] ?? DEFAULT_TARGETS.sales_executive,
    isDefault: !map[String(u._id)],
    setByName: map[String(u._id)]?.setByName,
    updatedAt: map[String(u._id)]?.updatedAt,
  }));
}

async function listTargetsForLeader(req, { year, month } = currentPeriod()) {
  const period = { year: Number(year), month: Number(month) };
  const execIds = await getExecutiveIdsForLeader(req.user._id);
  const users = await User.find({ _id: { $in: execIds } }).select('name email role').lean();

  const targets = await MonthlySalesTarget.find({
    userId: { $in: execIds },
    year: period.year,
    month: period.month,
  }).lean();

  const map = Object.fromEntries(targets.map((t) => [String(t.userId), t]));

  return users.map((u) => ({
    userId: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    revenueTarget: map[String(u._id)]?.revenueTarget ?? DEFAULT_TARGETS.sales_executive,
    isDefault: !map[String(u._id)],
    setByName: map[String(u._id)]?.setByName,
    updatedAt: map[String(u._id)]?.updatedAt,
  }));
}

function buildTargetProgress(revenueAchieved, monthlyTarget) {
  const target = monthlyTarget || DEFAULT_TARGETS.sales_executive;
  return {
    monthlyTarget: target,
    revenueAchieved,
    progress: target ? Math.min(100, Math.round((revenueAchieved / target) * 100)) : 0,
  };
}

module.exports = {
  DEFAULT_TARGETS,
  currentPeriod,
  getMonthlyTarget,
  setMonthlyTarget,
  listTargetsForManager,
  listTargetsForLeader,
  buildTargetProgress,
};
