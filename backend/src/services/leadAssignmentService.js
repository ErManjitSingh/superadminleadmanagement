const Lead = require('../models/Lead');
const User = require('../models/User');
const Team = require('../models/Team');
const Branch = require('../models/Branch');
const Role = require('../models/Role');
const ApiError = require('../utils/apiError');
const { ROLE_LABELS } = require('../config/roles');
const { withCompany, normalizeCompanyId } = require('../utils/branchScope');
const { getCompanyId } = require('../utils/tenantContextStore');
const { getExecutiveIdsForLeader, getLeaderLeadScopeFilter } = require('./teamScopeService');

const ASSIGNABLE_ROLES = ['sales_manager', 'team_leader', 'sales_executive'];

function buildAssignmentPatch(assigneeRole, assignee) {
  const patch = { assigneeRole };

  if (assigneeRole === 'sales_manager') {
    patch.assignedManager = assignee._id;
    patch.assignedTeamLeader = null;
    patch.assignedTo = assignee._id;
  } else if (assigneeRole === 'team_leader') {
    patch.assignedTeamLeader = assignee._id;
    patch.assignedTo = assignee._id;
    patch.assigneeRole = 'team_leader';
  } else if (assigneeRole === 'sales_executive') {
    patch.assignedTo = assignee._id;
    patch.assigneeRole = 'sales_executive';
  } else {
    throw new ApiError(400, 'Invalid assignee role');
  }

  return patch;
}

async function resolveAssignee(assigneeId, assigneeRole) {
  const assignee = await User.findOne(
    withCompany({
      _id: assigneeId,
      status: 'active',
      role: assigneeRole,
    })
  ).select('name email role');

  if (!assignee) throw new ApiError(404, 'Assignee not found or inactive');
  return assignee;
}

function leadScopeFilter(leadIds) {
  return withCompany({ _id: { $in: leadIds }, isDeleted: { $ne: true } });
}

/** Attach companyId/branchId to users created without tenant fields so they appear in assign lists. */
async function syncCompanyAssignees(companyId) {
  const normalizedId = normalizeCompanyId(companyId);
  if (!normalizedId) return;

  const branches = await Branch.find({ companyId: normalizedId }).select('_id').sort({ createdAt: 1 }).lean();
  const branchIds = branches.map((b) => b._id);
  const defaultBranchId = branchIds[0] || null;
  const companyRoleIds = await Role.find(withCompany({}, normalizedId)).distinct('_id');

  const baseFilter = {
    companyId: null,
    status: 'active',
    role: { $in: ASSIGNABLE_ROLES },
  };
  const setFields = { companyId: normalizedId };
  if (defaultBranchId) setFields.branchId = defaultBranchId;

  if (branchIds.length) {
    await User.updateMany(
      { ...baseFilter, branchId: { $in: branchIds } },
      { $set: { companyId: normalizedId } }
    );
  }

  if (companyRoleIds.length) {
    await User.updateMany(
      { ...baseFilter, roleId: { $in: companyRoleIds } },
      { $set: setFields }
    );
  }
}

/** Backfill companyId on legacy users/leads created before tenant scoping was enforced. */
async function ensureTenantRecordsForAssignment({ leadIds = [], assigneeId } = {}) {
  const companyId = normalizeCompanyId(getCompanyId());
  if (!companyId) return;

  await syncCompanyAssignees(companyId);

  const ops = [];
  if (assigneeId) {
    ops.push(User.updateOne({ _id: assigneeId, companyId: null }, { $set: { companyId } }));
  }
  if (leadIds.length) {
    ops.push(
      Lead.updateMany({ _id: { $in: leadIds }, companyId: null }, { $set: { companyId } })
    );
  }
  if (ops.length) await Promise.all(ops);
}

async function assertCanAssignLeads(req, { leadIds, assigneeRole, assigneeId }) {
  if (!ASSIGNABLE_ROLES.includes(assigneeRole)) {
    throw new ApiError(400, 'Invalid assignee role');
  }

  await ensureTenantRecordsForAssignment({ leadIds, assigneeId });
  const assignee = await resolveAssignee(assigneeId, assigneeRole);

  if (req.user.role === 'admin') {
    const count = await Lead.countDocuments(leadScopeFilter(leadIds));
    if (count !== leadIds.length) throw new ApiError(404, 'One or more leads were not found');
    return { assignee };
  }

  if (req.user.role === 'sales_manager') {
    if (assignee.role !== assigneeRole) {
      throw new ApiError(400, 'Assignee role does not match selected role');
    }
    const count = await Lead.countDocuments(leadScopeFilter(leadIds));
    if (count !== leadIds.length) throw new ApiError(404, 'One or more leads were not found');
    return { assignee };
  }

  if (req.user.role === 'team_leader') {
    if (assigneeRole !== 'sales_executive') {
      throw new ApiError(403, 'Team leaders can assign leads only to sales executives');
    }
    const execIds = await getExecutiveIdsForLeader(req.user._id);
    if (!execIds.some((id) => id === String(assigneeId))) {
      throw new ApiError(403, 'Executive is not in your team');
    }
    const scope = await getLeaderLeadScopeFilter(req.user._id);
    const count = await Lead.countDocuments({
      ...leadScopeFilter(leadIds),
      ...scope,
    });
    if (count !== leadIds.length) {
      throw new ApiError(403, 'One or more leads are outside your team scope');
    }
    const team = await Team.findOne({ teamLeader: req.user._id }).select('_id');
    return { assignee, teamId: team?._id };
  }

  throw new ApiError(403, 'You are not allowed to assign leads');
}

async function getAssigneesForUser(req) {
  const companyId = normalizeCompanyId(getCompanyId());
  await syncCompanyAssignees(companyId);

  const mapUser = (u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    roleName: ROLE_LABELS[u.role] || u.role,
  });

  if (req.user.role === 'team_leader') {
    const execIds = await getExecutiveIdsForLeader(req.user._id);
    if (!execIds.length) {
      return { salesManagers: [], teamLeaders: [], salesExecutives: [] };
    }
    const executives = await User.find(
      withCompany({
        _id: { $in: execIds },
        role: 'sales_executive',
        status: 'active',
      })
    )
      .select('name email role')
      .lean();
    return {
      salesManagers: [],
      teamLeaders: [],
      salesExecutives: executives.map(mapUser),
    };
  }

  const users = await User.find(
    withCompany({
      status: 'active',
      role: { $in: ASSIGNABLE_ROLES },
    })
  )
    .select('name email role')
    .lean();

  if (req.user.role === 'sales_manager') {
    return {
      salesManagers: users.filter((u) => u.role === 'sales_manager').map(mapUser),
      teamLeaders: users.filter((u) => u.role === 'team_leader').map(mapUser),
      salesExecutives: users.filter((u) => u.role === 'sales_executive').map(mapUser),
    };
  }

  return {
    salesManagers: users.filter((u) => u.role === 'sales_manager').map(mapUser),
    teamLeaders: users.filter((u) => u.role === 'team_leader').map(mapUser),
    salesExecutives: users.filter((u) => u.role === 'sales_executive').map(mapUser),
  };
}

module.exports = {
  ASSIGNABLE_ROLES,
  buildAssignmentPatch,
  assertCanAssignLeads,
  getAssigneesForUser,
  leadScopeFilter,
  ensureTenantRecordsForAssignment,
};
