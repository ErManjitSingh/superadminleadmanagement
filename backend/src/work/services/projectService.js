const crypto = require('crypto');
const mongoose = require('mongoose');
const AuditLog = require('../../models/AuditLog');
const User = require('../../models/User');
const ApiError = require('../../utils/apiError');
const { paginatedResponse } = require('../../utils/pagination');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Task = require('../models/Task');
const SubTask = require('../models/SubTask');
const Approval = require('../models/Approval');
const Attachment = require('../models/Attachment');
const Comment = require('../models/Comment');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const {
  canCreateProject,
  canManageProject,
  canViewProject,
  isWorkAdmin,
} = require('./resourceAccessService');

function requireCompanyId(companyId) {
  if (!companyId) throw new ApiError(403, 'Tenant context is required');
  return companyId;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function projectKey(name) {
  const prefix = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .replace(/[^a-z]/gi, '')
    .toUpperCase()
    .slice(0, 4) || 'PRJ';
  return `${prefix}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function projectHealth(project) {
  if (project.status === 'completed') return 'healthy';
  if (project.status === 'on_hold') return 'at_risk';
  if (!project.dueDate) return 'healthy';
  const remainingDays = (new Date(project.dueDate).getTime() - Date.now()) / 86400000;
  if (remainingDays < 0 && project.progress < 100) return 'delayed';
  if (remainingDays <= 7 && project.progress < 80) return 'at_risk';
  return 'healthy';
}

function withHealth(project) {
  return { ...project, health: projectHealth(project) };
}

function audit({ companyId, project, actor, action, ip, changes = [], meta = {} }) {
  return AuditLog.create({
    companyId,
    entityType: 'work_project',
    entityId: project._id,
    action,
    actorId: actor._id,
    actorName: actor.name,
    changes,
    ip,
    meta: { projectName: project.name, projectKey: project.key, ...meta },
  });
}

async function assertWorkspace(companyId, workspaceId) {
  const workspace = await Workspace.findOne({ _id: workspaceId, companyId, deletedAt: null }).lean();
  if (!workspace) throw new ApiError(404, 'Workspace not found');
  return workspace;
}

async function assertWorkspaceMembers(companyId, workspaceId, userIds) {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(String))];
  const [users, memberships] = await Promise.all([
    User.find({
      _id: { $in: uniqueIds },
      companyId,
      status: { $in: ['active', 'invited'] },
      'workAccess.enabled': { $ne: false },
    }).select('_id').lean(),
    WorkspaceMember.find({ companyId, workspaceId, userId: { $in: uniqueIds } }).select('userId').lean(),
  ]);
  const eligible = new Set(users.map((user) => String(user._id)));
  const workspaceMembers = new Set(memberships.map((member) => String(member.userId)));
  const invalid = uniqueIds.find((id) => !eligible.has(id) || !workspaceMembers.has(id));
  if (invalid) throw new ApiError(400, 'Manager, client, and project members must be eligible workspace members');
}

async function createProject({ companyId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const workspace = await assertWorkspace(companyId, payload.workspaceId);
  const allowed = await canCreateProject({
    companyId,
    workspaceId: workspace._id,
    userId: actor._id,
    workAccess,
  });
  if (!allowed) throw new ApiError(403, 'You cannot create projects in this workspace');

  const memberIds = [...new Set([String(payload.managerId), ...payload.memberIds, payload.clientId].filter(Boolean))];
  await assertWorkspaceMembers(companyId, workspace._id, memberIds);

  let project;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      project = await Project.create({
        companyId,
        workspaceId: workspace._id,
        key: projectKey(payload.name),
        name: payload.name,
        description: payload.description,
        clientId: payload.clientId || null,
        managerId: payload.managerId,
        createdBy: actor._id,
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        priority: payload.priority,
        status: payload.status,
        color: payload.color,
        icon: payload.icon,
        tags: [...new Set(payload.tags.map((tag) => tag.toLowerCase()))],
        visibility: payload.visibility,
      });
      break;
    } catch (error) {
      if (error?.code !== 11000 || attempt === 2) throw error;
    }
  }

  try {
    await ProjectMember.insertMany(memberIds.map((userId) => ({
      companyId,
      projectId: project._id,
      userId,
      role: userId === String(payload.managerId)
        ? 'manager'
        : userId === String(payload.clientId)
          ? 'client_viewer'
          : 'member',
      addedBy: actor._id,
    })));
  } catch (error) {
    await Project.deleteOne({ _id: project._id, companyId });
    throw error;
  }

  await audit({ companyId, project, actor, action: 'work_project_created', ip });
  return getProject({ companyId, projectId: project._id, actor, workAccess });
}

async function listProjects({ companyId, actor, workAccess, query }) {
  requireCompanyId(companyId);
  const { page, limit, search, workspaceId, managerId, status, priority } = query;
  const base = { companyId, deletedAt: null };
  const clauses = [];

  if (!isWorkAdmin(workAccess)) {
    const [workspaceIds, projectIds] = await Promise.all([
      WorkspaceMember.distinct('workspaceId', { companyId, userId: actor._id }),
      ProjectMember.distinct('projectId', { companyId, userId: actor._id }),
    ]);
    clauses.push({
      $or: [
        { _id: { $in: projectIds } },
        { managerId: actor._id },
        { workspaceId: { $in: workspaceIds }, visibility: 'workspace' },
      ],
    });
  }
  if (search) {
    const safeSearch = escapeRegex(search);
    clauses.push({
      $or: [
        { name: { $regex: safeSearch, $options: 'i' } },
        { key: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { tags: { $regex: safeSearch, $options: 'i' } },
      ],
    });
  }
  if (workspaceId) base.workspaceId = workspaceId;
  if (managerId) base.managerId = managerId;
  if (status) base.status = status;
  if (priority) base.priority = priority;
  if (clauses.length) base.$and = clauses;

  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    Project.find(base)
      .populate('workspaceId', 'name slug color icon')
      .populate('managerId', 'name email avatar workAccess')
      .populate('clientId', 'name email avatar')
      .sort({ updatedAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(base),
  ]);
  const projectIds = projects.map((project) => project._id);
  const memberCounts = await ProjectMember.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId), projectId: { $in: projectIds } } },
    { $group: { _id: '$projectId', count: { $sum: 1 } } },
  ]);
  const membersByProject = Object.fromEntries(memberCounts.map((item) => [String(item._id), item.count]));

  return paginatedResponse(projects.map((project) => withHealth({
    ...project,
    memberCount: membersByProject[String(project._id)] || 0,
  })), { page, limit, total });
}

async function getProject({ companyId, projectId, actor, workAccess }) {
  requireCompanyId(companyId);
  const project = await Project.findOne({ _id: projectId, companyId, deletedAt: null })
    .populate('workspaceId', 'name slug color icon status')
    .populate('managerId', 'name email avatar workAccess')
    .populate('clientId', 'name email avatar')
    .lean();
  if (!project) throw new ApiError(404, 'Project not found');
  const allowed = await canViewProject({ project, companyId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(404, 'Project not found');
  const members = await ProjectMember.find({ companyId, projectId })
    .populate('userId', 'name email avatar status workAccess')
    .sort({ role: 1, joinedAt: 1 })
    .lean();
  return withHealth({
    ...project,
    members,
    memberCount: members.length,
    access: {
      canManage: await canManageProject({ project, companyId, userId: actor._id, workAccess }),
    },
  });
}

async function updateProject({ companyId, projectId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const project = await Project.findOne({ _id: projectId, companyId, deletedAt: null });
  if (!project) throw new ApiError(404, 'Project not found');
  const allowed = await canManageProject({ project, companyId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(403, 'You cannot manage this project');

  const nextStart = payload.startDate === undefined ? project.startDate : payload.startDate && new Date(payload.startDate);
  const nextDue = payload.dueDate === undefined ? project.dueDate : payload.dueDate && new Date(payload.dueDate);
  if (nextStart && nextDue && nextDue < nextStart) {
    throw new ApiError(400, 'Due date cannot be before start date');
  }
  if (payload.managerId && String(payload.managerId) !== String(project.managerId)) {
    await assertWorkspaceMembers(companyId, project.workspaceId, [payload.managerId]);
  }

  const changes = [];
  for (const [field, rawValue] of Object.entries(payload)) {
    let value = rawValue;
    if (['startDate', 'dueDate'].includes(field)) value = rawValue ? new Date(rawValue) : null;
    if (field === 'tags') value = [...new Set(rawValue.map((tag) => tag.toLowerCase()))];
    const oldValue = project[field];
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      changes.push({ field, oldValue, newValue: value });
      project[field] = value;
    }
  }
  if (payload.status === 'completed' && !project.completedAt) project.completedAt = new Date();
  if (payload.status && payload.status !== 'completed') project.completedAt = null;
  await project.save();

  if (payload.managerId) {
    await ProjectMember.updateMany(
      { companyId, projectId, role: 'manager', userId: { $ne: payload.managerId } },
      { $set: { role: 'member' } },
    );
    await ProjectMember.findOneAndUpdate(
      { companyId, projectId, userId: payload.managerId },
      { $set: { role: 'manager', addedBy: actor._id }, $setOnInsert: { joinedAt: new Date() } },
      { upsert: true, new: true },
    );
  }
  if (changes.length) await audit({ companyId, project, actor, action: 'work_project_updated', ip, changes });
  return getProject({ companyId, projectId, actor, workAccess });
}

async function deleteProject({ companyId, projectId, actor, workAccess, ip }) {
  requireCompanyId(companyId);
  const project = await Project.findOne({ _id: projectId, companyId, deletedAt: null });
  if (!project) throw new ApiError(404, 'Project not found');
  const allowed = await canManageProject({ project, companyId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(403, 'You cannot delete this project');
  project.deletedAt = new Date();
  project.deletedBy = actor._id;
  await project.save();
  await Promise.all([
    Task.updateMany(
      { companyId, projectId, deletedAt: null },
      { $set: { deletedAt: project.deletedAt, deletedBy: actor._id } },
    ),
    SubTask.updateMany(
      { companyId, projectId, deletedAt: null },
      { $set: { deletedAt: project.deletedAt, deletedBy: actor._id } },
    ),
    Comment.updateMany(
      { companyId, projectId, deletedAt: null },
      { $set: { deletedAt: project.deletedAt, deletedBy: actor._id } },
    ),
    Attachment.updateMany(
      { companyId, projectId, deletedAt: null },
      { $set: { deletedAt: project.deletedAt, deletedBy: actor._id } },
    ),
    Approval.updateMany(
      { companyId, projectId, status: 'pending' },
      { $set: { status: 'cancelled', reviewedBy: actor._id, reviewedAt: project.deletedAt, reviewNote: 'Project deleted' } },
    ),
  ]);
  await audit({ companyId, project, actor, action: 'work_project_deleted', ip });
}

async function addProjectMember({ companyId, projectId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const project = await Project.findOne({ _id: projectId, companyId, deletedAt: null });
  if (!project) throw new ApiError(404, 'Project not found');
  const allowed = await canManageProject({ project, companyId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(403, 'You cannot manage members in this project');
  await assertWorkspaceMembers(companyId, project.workspaceId, [payload.userId]);
  if (payload.role === 'manager') throw new ApiError(400, 'Change the project manager from project settings');
  const existing = await ProjectMember.exists({ companyId, projectId, userId: payload.userId });
  if (existing) throw new ApiError(409, 'User is already a project member');
  const member = await ProjectMember.create({
    companyId,
    projectId,
    userId: payload.userId,
    role: payload.role,
    addedBy: actor._id,
  });
  await audit({
    companyId,
    project,
    actor,
    action: 'work_project_member_added',
    ip,
    meta: { userId: payload.userId, role: payload.role },
  });
  return member.populate('userId', 'name email avatar status workAccess');
}

async function updateProjectMember({ companyId, projectId, userId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const project = await Project.findOne({ _id: projectId, companyId, deletedAt: null });
  if (!project) throw new ApiError(404, 'Project not found');
  const allowed = await canManageProject({ project, companyId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(403, 'You cannot manage members in this project');
  const member = await ProjectMember.findOne({ companyId, projectId, userId });
  if (!member) throw new ApiError(404, 'Project member not found');
  if (member.role === 'manager' || payload.role === 'manager') {
    throw new ApiError(400, 'Change the project manager from project settings');
  }
  const oldRole = member.role;
  member.role = payload.role;
  await member.save();
  await audit({
    companyId,
    project,
    actor,
    action: 'work_project_member_updated',
    ip,
    changes: [{ field: 'role', oldValue: oldRole, newValue: payload.role }],
    meta: { userId },
  });
  return member.populate('userId', 'name email avatar status workAccess');
}

async function removeProjectMember({ companyId, projectId, userId, actor, workAccess, ip }) {
  requireCompanyId(companyId);
  const project = await Project.findOne({ _id: projectId, companyId, deletedAt: null });
  if (!project) throw new ApiError(404, 'Project not found');
  const allowed = await canManageProject({ project, companyId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(403, 'You cannot manage members in this project');
  const member = await ProjectMember.findOne({ companyId, projectId, userId });
  if (!member) throw new ApiError(404, 'Project member not found');
  if (member.role === 'manager' || String(project.managerId) === String(userId)) {
    throw new ApiError(400, 'Project manager cannot be removed');
  }
  await ProjectMember.deleteOne({ _id: member._id, companyId });
  await audit({
    companyId,
    project,
    actor,
    action: 'work_project_member_removed',
    ip,
    meta: { userId, role: member.role },
  });
}

module.exports = {
  addProjectMember,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  projectHealth,
  removeProjectMember,
  updateProject,
  updateProjectMember,
};
