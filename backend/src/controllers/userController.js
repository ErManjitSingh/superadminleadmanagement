const User = require('../models/User');
const Role = require('../models/Role');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const ActivityLog = require('../models/ActivityLog');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLE_LABELS, ROLES } = require('../config/roles');
const { logActivity, getClientIp } = require('../services/activityService');
const crypto = require('crypto');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { withCompany } = require('../utils/branchScope');
const { assertUserLimit } = require('../services/subscriptionLimitsService');
const { companyScopedIdFilter, assertTenantDocument } = require('../utils/tenantDocument');
const { sumConvertedPackageRevenue } = require('../utils/convertedPackageRevenue');

async function resolveRoleName(user) {
  if (user.roleId) {
    const role = await Role.findById(user.roleId).select('name').lean();
    if (role?.name) return role.name;
  }
  return ROLE_LABELS[user.role] || user.role || '—';
}

async function resolveUserTenantFields(req) {
  const companyId = req.companyId || req.user?.companyId || null;
  return { companyId, branchId: null };
}

async function attachLeadCounts(users) {
  if (!users.length) return users;
  const ids = users.map((u) => u._id);
  const rows = await Lead.aggregate([
    { $match: { assignedTo: { $in: ids } } },
    { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(rows.map((r) => [r._id.toString(), r.count]));
  return users.map((u) => ({
    ...u,
    assignedLeads: countMap[u._id.toString()] || 0,
  }));
}

const listUsers = asyncHandler(async (req, res) => {
  const { status, roleId, department, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = withCompany({}, req.companyId);
  if (req.branchId) filter.branchId = req.branchId;

  if (status) filter.status = status;
  if (roleId) filter.roleId = roleId;
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total, active, disabled] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
    User.countDocuments({ ...filter, status: 'active' }),
    User.countDocuments({ ...filter, status: 'disabled' }),
  ]);

  const withCounts = await attachLeadCounts(users);
  const roleIds = [...new Set(withCounts.map((u) => u.roleId).filter(Boolean).map(String))];
  const roleDocs = roleIds.length
    ? await Role.find({ _id: { $in: roleIds } }).select('name').lean()
    : [];
  const roleNameById = Object.fromEntries(roleDocs.map((r) => [String(r._id), r.name]));

  const rows = withCounts.map((u) => ({
    ...u,
    roleName: roleNameById[String(u.roleId)] || ROLE_LABELS[u.role] || u.role || '—',
  }));

  res.json({
    ...paginatedResponse(rows, { page, limit, total }),
    stats: {
      total,
      active,
      disabled,
    },
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findOne(companyScopedIdFilter(req.params.id, req)).select('-password').lean();
  assertTenantDocument(user, req, 'User');
  res.json({ ...user, roleName: ROLE_LABELS[user.role] || user.role });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne(companyScopedIdFilter(req.params.id, req)).select('-password').lean();
  assertTenantDocument(user, req, 'User');

  const leadFilter = { assignedTo: user._id };
  if (req.branchId) leadFilter.branchId = req.branchId;

  const followUpFilter = {
    $or: [{ assignedTo: user._id }, { createdBy: user._id }],
    status: 'completed',
  };
  if (req.branchId) followUpFilter.branchId = req.branchId;

  const activityFilter = { userId: user._id };
  if (req.branchId) activityFilter.branchId = req.branchId;

  const [assignedLeads, converted, followUpsDone, revenueGenerated, recentLeads, activity, roleName] =
    await Promise.all([
      Lead.countDocuments(leadFilter),
      Lead.countDocuments({ ...leadFilter, status: 'converted' }),
      FollowUp.countDocuments(followUpFilter),
      sumConvertedPackageRevenue({ assigneeId: user._id, branchId: req.branchId }),
      Lead.find(leadFilter)
        .select('name destination status')
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean(),
      ActivityLog.find(activityFilter).sort({ createdAt: -1 }).limit(10).lean(),
      resolveRoleName(user),
    ]);

  const conversionRate = assignedLeads > 0 ? Math.round((converted / assignedLeads) * 100) : 0;

  res.json({
    ...user,
    roleName,
    stats: {
      assignedLeads,
      followUpsDone,
      revenueGenerated: revenueGenerated || 0,
      conversionRate,
      converted,
    },
    recentLeads: recentLeads || [],
    activity: (activity || []).map((item) => ({
      _id: item._id,
      action: item.action,
      target: item.target || '—',
      date: item.createdAt,
    })),
  });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, roleId, department, status, password, branchId } = req.body;
  if (!name?.trim() || !email?.trim()) {
    throw new ApiError(400, 'Name and email are required');
  }
  if (!roleId) throw new ApiError(400, 'Role is required');

  const role = await Role.findOne({ _id: roleId, ...withCompany({}, req.companyId) });
  if (!role) throw new ApiError(400, 'Invalid role');
  if (!ROLES.includes(role.slug)) {
    throw new ApiError(400, 'Role is not a valid system role');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const exists = await User.findOne(withCompany({ email: normalizedEmail }, req.companyId));
  if (exists) throw new ApiError(400, 'User with this email already exists');

  await assertUserLimit(req.companyId);

  const plainPassword = password?.trim();
  if (!plainPassword || plainPassword.length < 6) {
    throw new ApiError(400, 'Password is required (minimum 6 characters)');
  }

  const { companyId, branchId: resolvedBranchId } = await resolveUserTenantFields(req, { branchId });

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone?.trim() || '',
    role: role.slug,
    roleId: role._id,
    department: department || 'Sales',
    status: status || 'active',
    password: plainPassword,
    companyId: companyId || undefined,
    branchId: resolvedBranchId,
  });

  await logActivity({
    type: 'user_action',
    user: req.user.name,
    userId: req.user._id,
    action: 'Created user',
    target: user.name,
    ip: getClientIp(req),
    branchId: user.branchId || req.branchId || null,
  });

  const obj = user.toObject();
  delete obj.password;
  res.status(201).json({ ...obj, roleName: ROLE_LABELS[obj.role] || obj.role });
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(user, req, 'User');

  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot change your own account status');
  }

  if (user.status === 'invited') {
    throw new ApiError(400, 'Invited users must accept the invite before you can activate them');
  }

  const requestedStatus = req.body?.status;
  let nextStatus;
  if (requestedStatus === 'active' || requestedStatus === 'disabled') {
    nextStatus = requestedStatus;
  } else {
    nextStatus = user.status === 'active' ? 'disabled' : 'active';
  }

  if (nextStatus === user.status) {
    const obj = user.toObject();
    delete obj.password;
    return res.json({ ...obj, roleName: ROLE_LABELS[obj.role] || obj.role });
  }

  user.status = nextStatus;
  await user.save();

  await logActivity({
    type: 'user_action',
    user: req.user.name,
    userId: req.user._id,
    action: nextStatus === 'active' ? 'Activated user' : 'Deactivated user',
    target: user.name,
    ip: getClientIp(req),
    branchId: user.branchId || req.branchId || null,
  });

  const obj = user.toObject();
  delete obj.password;
  res.json({ ...obj, roleName: ROLE_LABELS[obj.role] || obj.role });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(user, req, 'User');

  if (String(user._id) === String(req.user._id) && req.body.status && req.body.status !== user.status) {
    throw new ApiError(400, 'You cannot change your own account status');
  }

  if (req.body.roleId) {
    const role = await Role.findOne({ _id: req.body.roleId, ...withCompany({}, req.companyId) });
    if (!role) throw new ApiError(400, 'Invalid role');
    user.roleId = role._id;
    user.role = role.slug;
  }

  const { roleId, roleName, password, ...rest } = req.body;
  if (req.user.role !== 'admin') delete rest.branchId;
  Object.assign(user, rest);
  if (password?.trim()) {
    if (password.trim().length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
    user.password = password.trim();
  }
  await user.save();

  await logActivity({
    type: 'user_action',
    user: req.user.name,
    userId: req.user._id,
    action:
      req.body.status === 'disabled'
        ? 'Deactivated user'
        : req.body.status === 'active'
          ? 'Activated user'
          : 'Updated user',
    target: user.name,
    ip: getClientIp(req),
    branchId: user.branchId || req.branchId || null,
  });

  const obj = user.toObject();
  delete obj.password;
  res.json({ ...obj, roleName: ROLE_LABELS[obj.role] || obj.role });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(user, req, 'User');
  await user.deleteOne();

  await logActivity({
    type: 'user_action',
    user: req.user.name,
    userId: req.user._id,
    action: 'Deleted user',
    target: user.name,
    ip: getClientIp(req),
    branchId: user.branchId || req.branchId || null,
  });

  res.json({ message: 'User deleted' });
});

const inviteUser = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.body.roleId, ...withCompany({}, req.companyId) });
  if (!role) throw new ApiError(400, 'Invalid role');

  await assertUserLimit(req.companyId);

  const token = `inv-${crypto.randomBytes(16).toString('hex')}`;
  const invitePassword = crypto.randomBytes(8).toString('hex');

  const { companyId, branchId: resolvedBranchId } = await resolveUserTenantFields(req, {
    branchId: req.body.branchId,
  });

  const user = await User.create({
    name: req.body.name || req.body.email.split('@')[0],
    email: req.body.email.toLowerCase().trim(),
    phone: req.body.phone || '',
    password: invitePassword,
    role: role.slug,
    roleId: role._id,
    department: req.body.department || 'Sales',
    status: 'invited',
    companyId: companyId || undefined,
    branchId: resolvedBranchId,
    inviteToken: token,
    inviteExpiresAt: new Date(Date.now() + 7 * 86400000),
  });

  await logActivity({
    type: 'user_action',
    user: req.user.name,
    userId: req.user._id,
    action: 'Invited user',
    target: user.email,
    ip: getClientIp(req),
    branchId: user.branchId || req.branchId || null,
  });

  const obj = user.toObject();
  delete obj.password;
  res.status(201).json({ user: obj, inviteToken: token, message: 'Invitation sent successfully' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(user, req, 'User');

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  user.password = temporaryPassword;
  user.status = user.status === 'invited' ? 'active' : user.status;
  await user.save();

  await logActivity({
    type: 'user_action',
    user: req.user.name,
    userId: req.user._id,
    action: 'Reset password',
    target: user.name,
    ip: getClientIp(req),
    branchId: user.branchId || req.branchId || null,
  });

  res.json({
    message: 'Password reset successfully',
    temporaryPassword,
  });
});

module.exports = {
  listUsers,
  getUser,
  getUserProfile,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  inviteUser,
  resetPassword,
};
