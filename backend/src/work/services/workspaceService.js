const mongoose = require('mongoose');
const AuditLog = require('../../models/AuditLog');
const User = require('../../models/User');
const ApiError = require('../../utils/apiError');
const { paginatedResponse } = require('../../utils/pagination');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const Project = require('../models/Project');
const Task = require('../models/Task');
const SubTask = require('../models/SubTask');
const Approval = require('../models/Approval');
const Attachment = require('../models/Attachment');
const Comment = require('../models/Comment');
const {
  canCreateProject,
  canManageWorkspace,
  canViewWorkspace,
  isWorkAdmin,
} = require('./resourceAccessService');

function requireCompanyId(companyId) {
  if (!companyId) throw new ApiError(403, 'Tenant context is required');
  return companyId;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'workspace';
}

async function uniqueSlug(companyId, name, excludeWorkspaceId = null) {
  const base = slugify(name);
  let candidate = base;
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const filter = { companyId, slug: candidate };
    if (excludeWorkspaceId) filter._id = { $ne: excludeWorkspaceId };
    const exists = await Workspace.exists(filter);
    if (!exists) return candidate;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${new mongoose.Types.ObjectId().toString().slice(-6)}`;
}

function audit({ companyId, workspace, actor, action, ip, changes = [], meta = {} }) {
  return AuditLog.create({
    companyId,
    entityType: 'work_workspace',
    entityId: workspace._id,
    action,
    actorId: actor._id,
    actorName: actor.name,
    changes,
    ip,
    meta: { workspaceName: workspace.name, ...meta },
  });
}

async function assertEligibleUser(companyId, userId) {
  const user = await User.findOne({
    _id: userId,
    companyId,
    status: { $in: ['active', 'invited'] },
    'workAccess.enabled': { $ne: false },
  }).select('_id name email avatar workAccess').lean();
  if (!user) throw new ApiError(400, 'User is not eligible for WorkFlow Hub membership');
  return user;
}

async function createWorkspace({ companyId, actor, payload, ip }) {
  requireCompanyId(companyId);
  const slug = await uniqueSlug(companyId, payload.name);
  const workspace = await Workspace.create({
    companyId,
    name: payload.name,
    slug,
    description: payload.description,
    ownerId: actor._id,
    color: payload.color,
    icon: payload.icon,
  });

  try {
    const memberIds = [...new Set([String(actor._id), ...payload.memberIds])];
    const users = await User.find({
      _id: { $in: memberIds },
      companyId,
      status: { $in: ['active', 'invited'] },
      'workAccess.enabled': { $ne: false },
    }).select('_id').lean();
    const eligibleIds = new Set(users.map((user) => String(user._id)));
    const invalidMember = memberIds.find((userId) => !eligibleIds.has(userId));
    if (invalidMember) throw new ApiError(400, 'One or more workspace members are not eligible');

    await WorkspaceMember.insertMany(memberIds.map((userId) => ({
      companyId,
      workspaceId: workspace._id,
      userId,
      role: userId === String(actor._id) ? 'owner' : 'member',
      addedBy: actor._id,
    })));
  } catch (error) {
    await Workspace.deleteOne({ _id: workspace._id, companyId });
    throw error;
  }

  await audit({ companyId, workspace, actor, action: 'work_workspace_created', ip });
  return getWorkspace({
    companyId,
    workspaceId: workspace._id,
    actor,
    workAccess: { role: 'admin', enabled: true },
  });
}

async function listWorkspaces({ companyId, actor, workAccess, query }) {
  requireCompanyId(companyId);
  const { page, limit, search, status } = query;
  const filter = { companyId, deletedAt: null };
  if (!isWorkAdmin(workAccess)) {
    const membershipIds = await WorkspaceMember.distinct('workspaceId', {
      companyId,
      userId: actor._id,
    });
    filter._id = { $in: membershipIds };
  }
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
    ];
  }
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [workspaces, total] = await Promise.all([
    Workspace.find(filter)
      .populate('ownerId', 'name email avatar')
      .sort({ updatedAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Workspace.countDocuments(filter),
  ]);
  const workspaceIds = workspaces.map((workspace) => workspace._id);
  const [memberCounts, projectCounts] = await Promise.all([
    WorkspaceMember.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId), workspaceId: { $in: workspaceIds } } },
      { $group: { _id: '$workspaceId', count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId), workspaceId: { $in: workspaceIds }, deletedAt: null } },
      { $group: { _id: '$workspaceId', count: { $sum: 1 } } },
    ]),
  ]);
  const membersByWorkspace = Object.fromEntries(memberCounts.map((item) => [String(item._id), item.count]));
  const projectsByWorkspace = Object.fromEntries(projectCounts.map((item) => [String(item._id), item.count]));

  return paginatedResponse(workspaces.map((workspace) => ({
    ...workspace,
    memberCount: membersByWorkspace[String(workspace._id)] || 0,
    projectCount: projectsByWorkspace[String(workspace._id)] || 0,
  })), { page, limit, total });
}

async function getWorkspace({ companyId, workspaceId, actor, workAccess }) {
  requireCompanyId(companyId);
  const workspace = await Workspace.findOne({ _id: workspaceId, companyId, deletedAt: null })
    .populate('ownerId', 'name email avatar')
    .lean();
  if (!workspace) throw new ApiError(404, 'Workspace not found');
  const allowed = await canViewWorkspace({ companyId, workspaceId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(404, 'Workspace not found');

  const [members, projectCount, membership] = await Promise.all([
    WorkspaceMember.find({ companyId, workspaceId })
      .populate('userId', 'name email avatar status workAccess')
      .sort({ role: 1, joinedAt: 1 })
      .lean(),
    Project.countDocuments({ companyId, workspaceId, deletedAt: null }),
    WorkspaceMember.findOne({ companyId, workspaceId, userId: actor._id }).lean(),
  ]);
  const resourceContext = { companyId, workspaceId, userId: actor._id, workAccess };
  return {
    ...workspace,
    members,
    memberCount: members.length,
    projectCount,
    access: {
      membershipRole: membership?.role || null,
      canManage: await canManageWorkspace(resourceContext),
      canCreateProject: await canCreateProject(resourceContext),
    },
  };
}

async function updateWorkspace({ companyId, workspaceId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const workspace = await Workspace.findOne({ _id: workspaceId, companyId, deletedAt: null });
  if (!workspace) throw new ApiError(404, 'Workspace not found');
  const allowed = await canManageWorkspace({ companyId, workspaceId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(403, 'You cannot manage this workspace');

  const nameChanged = Boolean(payload.name && payload.name !== workspace.name);
  const changes = [];
  for (const [field, value] of Object.entries(payload)) {
    const oldValue = field === 'settings' ? workspace.settings.toObject() : workspace[field];
    const newValue = field === 'settings' ? { ...oldValue, ...value } : value;
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field, oldValue, newValue });
      workspace[field] = newValue;
    }
  }
  if (nameChanged) {
    workspace.slug = await uniqueSlug(companyId, payload.name, workspace._id);
  }
  await workspace.save();
  if (changes.length) {
    await audit({ companyId, workspace, actor, action: 'work_workspace_updated', ip, changes });
  }
  return getWorkspace({ companyId, workspaceId, actor, workAccess });
}

async function deleteWorkspace({ companyId, workspaceId, actor, workAccess, ip }) {
  requireCompanyId(companyId);
  const workspace = await Workspace.findOne({ _id: workspaceId, companyId, deletedAt: null });
  if (!workspace) throw new ApiError(404, 'Workspace not found');
  const allowed = await canManageWorkspace({ companyId, workspaceId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(403, 'You cannot delete this workspace');
  const deletedAt = new Date();
  workspace.deletedAt = deletedAt;
  workspace.deletedBy = actor._id;
  await workspace.save();
  await Promise.all([
    Project.updateMany(
      { companyId, workspaceId, deletedAt: null },
      { $set: { deletedAt, deletedBy: actor._id } },
    ),
    Task.updateMany(
      { companyId, workspaceId, deletedAt: null },
      { $set: { deletedAt, deletedBy: actor._id } },
    ),
    SubTask.updateMany(
      { companyId, workspaceId, deletedAt: null },
      { $set: { deletedAt, deletedBy: actor._id } },
    ),
    Comment.updateMany(
      { companyId, workspaceId, deletedAt: null },
      { $set: { deletedAt, deletedBy: actor._id } },
    ),
    Attachment.updateMany(
      { companyId, workspaceId, deletedAt: null },
      { $set: { deletedAt, deletedBy: actor._id } },
    ),
    Approval.updateMany(
      { companyId, workspaceId, status: 'pending' },
      { $set: { status: 'cancelled', reviewedBy: actor._id, reviewedAt: deletedAt, reviewNote: 'Workspace deleted' } },
    ),
  ]);
  await audit({ companyId, workspace, actor, action: 'work_workspace_deleted', ip });
}

async function addWorkspaceMember({ companyId, workspaceId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const workspace = await Workspace.findOne({ _id: workspaceId, companyId, deletedAt: null });
  if (!workspace) throw new ApiError(404, 'Workspace not found');
  const allowed = await canManageWorkspace({ companyId, workspaceId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(403, 'You cannot manage members in this workspace');
  await assertEligibleUser(companyId, payload.userId);
  if (payload.role === 'owner') throw new ApiError(400, 'Workspace ownership transfer is not supported here');

  const existing = await WorkspaceMember.exists({ companyId, workspaceId, userId: payload.userId });
  if (existing) throw new ApiError(409, 'User is already a workspace member');
  const member = await WorkspaceMember.create({
    companyId,
    workspaceId,
    userId: payload.userId,
    role: payload.role,
    addedBy: actor._id,
  });
  await audit({
    companyId,
    workspace,
    actor,
    action: 'work_workspace_member_added',
    ip,
    meta: { userId: payload.userId, role: payload.role },
  });
  return member.populate('userId', 'name email avatar status workAccess');
}

async function updateWorkspaceMember({ companyId, workspaceId, userId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const workspace = await Workspace.findOne({ _id: workspaceId, companyId, deletedAt: null });
  if (!workspace) throw new ApiError(404, 'Workspace not found');
  const allowed = await canManageWorkspace({ companyId, workspaceId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(403, 'You cannot manage members in this workspace');
  const member = await WorkspaceMember.findOne({ companyId, workspaceId, userId });
  if (!member) throw new ApiError(404, 'Workspace member not found');
  if (member.role === 'owner' || payload.role === 'owner') {
    throw new ApiError(400, 'Workspace ownership cannot be changed here');
  }
  const oldRole = member.role;
  member.role = payload.role;
  await member.save();
  await audit({
    companyId,
    workspace,
    actor,
    action: 'work_workspace_member_updated',
    ip,
    changes: [{ field: 'role', oldValue: oldRole, newValue: payload.role }],
    meta: { userId },
  });
  return member.populate('userId', 'name email avatar status workAccess');
}

async function removeWorkspaceMember({ companyId, workspaceId, userId, actor, workAccess, ip }) {
  requireCompanyId(companyId);
  const workspace = await Workspace.findOne({ _id: workspaceId, companyId, deletedAt: null });
  if (!workspace) throw new ApiError(404, 'Workspace not found');
  const allowed = await canManageWorkspace({ companyId, workspaceId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(403, 'You cannot manage members in this workspace');
  const member = await WorkspaceMember.findOne({ companyId, workspaceId, userId });
  if (!member) throw new ApiError(404, 'Workspace member not found');
  if (member.role === 'owner') throw new ApiError(400, 'Workspace owner cannot be removed');
  const managedProjects = await Project.countDocuments({ companyId, workspaceId, managerId: userId, deletedAt: null });
  if (managedProjects) throw new ApiError(409, 'Reassign this member’s projects before removing them');
  await WorkspaceMember.deleteOne({ _id: member._id, companyId });
  await audit({
    companyId,
    workspace,
    actor,
    action: 'work_workspace_member_removed',
    ip,
    meta: { userId, role: member.role },
  });
}

module.exports = {
  addWorkspaceMember,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMember,
};
