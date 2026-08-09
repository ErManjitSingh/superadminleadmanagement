const crypto = require('crypto');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/apiError');
const { paginatedResponse } = require('../../utils/pagination');
const { assertUserLimit } = require('../../services/subscriptionLimitsService');
const {
  CRM_ROLE_TO_WORK_ROLE,
  WORK_DISCIPLINE_LABELS,
  WORK_ROLE_LABELS,
  resolveWorkAccess,
} = require('../config/access');

function requireCompanyId(companyId) {
  if (!companyId) throw new ApiError(403, 'Tenant context is required');
  return companyId;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const random = Array.from(
    { length: 12 },
    () => alphabet[crypto.randomInt(0, alphabet.length)],
  ).join('');
  return `Wf!${random}7`;
}

function roleFilter(workRole) {
  const fallbackCrmRoles = Object.entries(CRM_ROLE_TO_WORK_ROLE)
    .filter(([, mappedRole]) => mappedRole === workRole)
    .map(([crmRole]) => crmRole);

  const choices = [{ 'workAccess.role': workRole }];
  if (fallbackCrmRoles.length) {
    choices.push({
      $and: [
        {
          $or: [
            { 'workAccess.role': { $exists: false } },
            { 'workAccess.role': null },
          ],
        },
        { role: { $in: fallbackCrmRoles } },
      ],
    });
  }
  return { $or: choices };
}

function serializeUser(user) {
  const access = resolveWorkAccess(user);
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    avatar: user.avatar || null,
    status: user.status,
    department: user.department || '',
    crmRole: user.role,
    lastLogin: user.lastLogin || null,
    workAccess: {
      ...access,
      disciplineLabels: access.disciplines.map(
        (discipline) => WORK_DISCIPLINE_LABELS[discipline] || discipline,
      ),
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function listWorkUsers({ companyId, query }) {
  requireCompanyId(companyId);
  const { page, limit, search, role, discipline, status, enabled } = query;
  const filter = { companyId };

  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
      { 'workAccess.jobTitle': { $regex: safeSearch, $options: 'i' } },
    ];
  }
  if (status) filter.status = status;
  if (discipline) filter['workAccess.disciplines'] = discipline;
  if (enabled === 'false') filter['workAccess.enabled'] = false;
  if (enabled === 'true') filter['workAccess.enabled'] = { $ne: false };

  if (role) {
    const scopedRoleFilter = roleFilter(role);
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, scopedRoleFilter];
      delete filter.$or;
    } else {
      Object.assign(filter, scopedRoleFilter);
    }
  }

  const skip = (page - 1) * limit;
  const [users, total, companyTotal, active, disabled, workDisabled] = await Promise.all([
    User.find(filter)
      .select('name email phone avatar status department role lastLogin workAccess createdAt updatedAt')
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
    User.countDocuments({ companyId }),
    User.countDocuments({ companyId, status: 'active', 'workAccess.enabled': { $ne: false } }),
    User.countDocuments({ companyId, status: 'disabled' }),
    User.countDocuments({ companyId, 'workAccess.enabled': false }),
  ]);

  return {
    ...paginatedResponse(users.map(serializeUser), { page, limit, total }),
    stats: { total: companyTotal, active, disabled, workDisabled },
  };
}

async function updateWorkAccess({ companyId, targetUserId, actor, payload, ip }) {
  requireCompanyId(companyId);
  const user = await User.findOne({ _id: targetUserId, companyId });
  if (!user) throw new ApiError(404, 'User not found');

  const current = resolveWorkAccess(user);
  const isSelf = String(user._id) === String(actor._id);
  if (isSelf && (payload.enabled === false || (payload.role && payload.role !== 'admin'))) {
    throw new ApiError(400, 'You cannot remove your own WorkFlow Hub administrator access');
  }

  const before = {
    enabled: current.enabled,
    role: current.role,
    disciplines: current.disciplines,
    jobTitle: current.jobTitle,
  };

  if (payload.enabled !== undefined) user.workAccess.enabled = payload.enabled;
  if (payload.role !== undefined) user.workAccess.role = payload.role;
  if (payload.disciplines !== undefined) user.workAccess.disciplines = [...new Set(payload.disciplines)];
  if (payload.jobTitle !== undefined) user.workAccess.jobTitle = payload.jobTitle;

  await user.save();
  const afterResolved = resolveWorkAccess(user);
  const after = {
    enabled: afterResolved.enabled,
    role: afterResolved.role,
    disciplines: afterResolved.disciplines,
    jobTitle: afterResolved.jobTitle,
  };

  const changes = Object.keys(after)
    .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .map((field) => ({ field: `workAccess.${field}`, oldValue: before[field], newValue: after[field] }));

  if (changes.length) {
    await AuditLog.create({
      companyId,
      entityType: 'work_user_access',
      entityId: user._id,
      action: 'work_access_updated',
      actorId: actor._id,
      actorName: actor.name,
      changes,
      ip,
      meta: { targetUserName: user.name, targetUserEmail: user.email },
    });
  }

  return serializeUser(user.toObject());
}

async function createWorkUser({ companyId, actor, payload, ip }) {
  requireCompanyId(companyId);
  const existing = await User.findOne({ companyId, email: payload.email }).select('_id').lean();
  if (existing) throw new ApiError(409, 'A user with this email already exists');

  await assertUserLimit(companyId);

  const inviteToken = `inv-${crypto.randomBytes(24).toString('hex')}`;
  const temporaryPassword = crypto.randomBytes(24).toString('hex');
  const user = await User.create({
    companyId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: temporaryPassword,
    role: 'work_user',
    department: 'Projects',
    status: 'invited',
    inviteToken,
    inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    workAccess: {
      enabled: true,
      role: payload.role,
      disciplines: [...new Set(payload.disciplines)],
      jobTitle: payload.jobTitle,
    },
  });

  await AuditLog.create({
    companyId,
    entityType: 'work_user_access',
    entityId: user._id,
    action: 'work_user_invited',
    actorId: actor._id,
    actorName: actor.name,
    ip,
    meta: { targetUserName: user.name, targetUserEmail: user.email },
  });

  return {
    user: serializeUser(user.toObject()),
    inviteToken,
    inviteExpiresAt: user.inviteExpiresAt,
  };
}

async function resetWorkUserPassword({ companyId, targetUserId, actor, ip }) {
  requireCompanyId(companyId);
  if (String(targetUserId) === String(actor._id)) {
    throw new ApiError(400, 'Use your profile settings to change your own password');
  }
  const user = await User.findOne({ _id: targetUserId, companyId });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.status === 'disabled') {
    throw new ApiError(409, 'Enable the user account before generating login credentials');
  }
  if (user.workAccess?.enabled === false) {
    throw new ApiError(409, 'Enable WorkFlow Hub access before generating login credentials');
  }

  const temporaryPassword = generateTemporaryPassword();
  user.password = temporaryPassword;
  user.status = 'active';
  user.inviteToken = undefined;
  user.inviteExpiresAt = undefined;
  await user.save();

  await AuditLog.create({
    companyId,
    entityType: 'work_user_access',
    entityId: user._id,
    action: 'work_temporary_password_generated',
    actorId: actor._id,
    actorName: actor.name,
    ip,
    meta: { targetUserName: user.name, targetUserEmail: user.email },
  });

  return {
    user: serializeUser(user.toObject()),
    loginId: user.email,
    temporaryPassword,
  };
}

function getAccessConfiguration() {
  return {
    roles: Object.entries(WORK_ROLE_LABELS).map(([value, label]) => ({ value, label })),
    disciplines: Object.entries(WORK_DISCIPLINE_LABELS).map(([value, label]) => ({ value, label })),
  };
}

module.exports = {
  createWorkUser,
  generateTemporaryPassword,
  getAccessConfiguration,
  listWorkUsers,
  resetWorkUserPassword,
  serializeUser,
  updateWorkAccess,
};
