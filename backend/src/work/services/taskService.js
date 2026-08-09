const crypto = require('crypto');
const mongoose = require('mongoose');
const AuditLog = require('../../models/AuditLog');
const User = require('../../models/User');
const ApiError = require('../../utils/apiError');
const { paginatedResponse } = require('../../utils/pagination');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const Task = require('../models/Task');
const SubTask = require('../models/SubTask');
const WorkActivityLog = require('../models/ActivityLog');
const Approval = require('../models/Approval');
const Attachment = require('../models/Attachment');
const Comment = require('../models/Comment');
const { canManageProject, canViewProject, isWorkAdmin } = require('./resourceAccessService');

function requireCompanyId(companyId) {
  if (!companyId) throw new ApiError(403, 'Tenant context is required');
  return companyId;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function taskKey(projectKey) {
  return `${projectKey}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function audit({ companyId, task, actor, action, ip, changes = [], meta = {} }) {
  const activityMeta = { taskTitle: task.title, taskKey: task.key, projectId: task.projectId, ...meta };
  const publicChanges = changes.map((change) => (
    change.field === 'paymentAmount'
      ? { ...change, oldValue: '[private]', newValue: '[private]' }
      : change
  ));
  return Promise.all([
    AuditLog.create({
      companyId,
      entityType: 'work_task',
      entityId: task._id,
      action,
      actorId: actor._id,
      actorName: actor.name,
      changes,
      ip,
      meta: activityMeta,
    }),
    WorkActivityLog.create({
      companyId,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task._id,
      actorId: actor._id,
      action,
      summary: `${actor.name || 'A user'} ${action.replace(/^work_/, '').replaceAll('_', ' ')}`,
      meta: { ...activityMeta, changes: publicChanges },
    }),
  ]);
}

async function findProject(companyId, projectId) {
  const project = await Project.findOne({ _id: projectId, companyId, deletedAt: null });
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
}

async function findTask(companyId, taskId) {
  const task = await Task.findOne({ _id: taskId, companyId, deletedAt: null });
  if (!task) throw new ApiError(404, 'Task not found');
  return task;
}

async function assertTaskVisible({ companyId, task, actor, workAccess }) {
  const project = await findProject(companyId, task.projectId);
  const allowed = await canViewProject({ project, companyId, userId: actor._id, workAccess });
  if (!allowed) throw new ApiError(404, 'Task not found');
  return project;
}

async function getTaskAccessContext({ companyId, taskId, actor, workAccess }) {
  const task = await findTask(companyId, taskId);
  const project = await assertTaskVisible({ companyId, task, actor, workAccess });
  const editScope = await taskEditScope({ companyId, task, project, actor, workAccess });
  return { task, project, editScope };
}

async function canCreateTask({ companyId, project, actor, workAccess }) {
  if (isWorkAdmin(workAccess)) return true;
  const canView = await canViewProject({ project, companyId, userId: actor._id, workAccess });
  if (!canView) return false;
  if (workAccess?.permissions?.createTasks) return true;
  const workspace = await Workspace.findOne({
    _id: project.workspaceId,
    companyId,
    deletedAt: null,
  }).select('settings.allowMemberTaskCreation').lean();
  return Boolean(workspace?.settings?.allowMemberTaskCreation && workAccess?.role === 'member');
}

async function taskEditScope({ companyId, task, project, actor, workAccess }) {
  if (await canManageProject({ project, companyId, userId: actor._id, workAccess })) return 'manage';
  if (String(task.createdBy) === String(actor._id) && workAccess?.permissions?.createTasks) return 'creator';
  if (
    task.assigneeIds.some((assigneeId) => String(assigneeId) === String(actor._id))
    && workAccess?.permissions?.updateOwnTasks
  ) return 'assignee';
  return null;
}

function documentId(value) {
  return value?._id || value;
}

function canViewTaskPayment({ task, actor, workAccess, editScope }) {
  if (isWorkAdmin(workAccess) || editScope === 'manage') return true;
  if (task.assigneeIds.some((assignee) => String(documentId(assignee)) === String(actor._id))) return true;
  return String(documentId(task.projectId?.managerId)) === String(actor._id);
}

function hideTaskPayment(task) {
  const sanitized = { ...task };
  delete sanitized.paymentAmount;
  delete sanitized.paymentCurrency;
  return sanitized;
}

function withTaskPaymentDefaults(task) {
  return {
    ...task,
    paymentAmount: Number(task.paymentAmount || 0),
    paymentCurrency: task.paymentCurrency || 'INR',
  };
}

async function assertAssignees(companyId, projectId, assigneeIds) {
  const uniqueIds = [...new Set(assigneeIds.map(String))];
  if (!uniqueIds.length) return;
  const [users, members] = await Promise.all([
    User.find({
      _id: { $in: uniqueIds },
      companyId,
      status: { $in: ['active', 'invited'] },
      'workAccess.enabled': { $ne: false },
    }).select('_id').lean(),
    ProjectMember.find({ companyId, projectId, userId: { $in: uniqueIds } }).select('userId').lean(),
  ]);
  const validUsers = new Set(users.map((user) => String(user._id)));
  const projectUsers = new Set(members.map((member) => String(member.userId)));
  if (uniqueIds.some((id) => !validUsers.has(id) || !projectUsers.has(id))) {
    throw new ApiError(400, 'Task assignees must be active project members');
  }
}

async function nextOrder(companyId, projectId, status) {
  const last = await Task.findOne({ companyId, projectId, status, deletedAt: null })
    .select('order')
    .sort({ order: -1 })
    .lean();
  return (last?.order || 0) + 1000;
}

async function refreshProjectProgress(companyId, projectId) {
  const [counts] = await Task.aggregate([
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
        projectId: new mongoose.Types.ObjectId(projectId),
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
  ]);
  const progress = counts?.total ? Math.round((counts.completed / counts.total) * 100) : 0;
  await Project.updateOne({ _id: projectId, companyId }, { $set: { progress } });
  return progress;
}

async function accessibleProjectIds(companyId, actor, workAccess) {
  if (isWorkAdmin(workAccess)) {
    return Project.distinct('_id', { companyId, deletedAt: null });
  }
  const [workspaceIds, memberProjectIds] = await Promise.all([
    WorkspaceMember.distinct('workspaceId', { companyId, userId: actor._id }),
    ProjectMember.distinct('projectId', { companyId, userId: actor._id }),
  ]);
  return Project.distinct('_id', {
    companyId,
    deletedAt: null,
    $or: [
      { _id: { $in: memberProjectIds } },
      { managerId: actor._id },
      { workspaceId: { $in: workspaceIds }, visibility: 'workspace' },
    ],
  });
}

function dueRange(filter, due) {
  if (!due) return;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const tomorrow = new Date(start);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const weekEnd = new Date(start);
  weekEnd.setDate(weekEnd.getDate() + 7);
  if (due === 'overdue') filter.dueDate = { $lt: start };
  if (due === 'today') filter.dueDate = { $gte: start, $lt: tomorrow };
  if (due === 'tomorrow') filter.dueDate = { $gte: tomorrow, $lt: dayAfter };
  if (due === 'week') filter.dueDate = { $gte: start, $lt: weekEnd };
}

async function createTask({ companyId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const project = await findProject(companyId, payload.projectId);
  if (['completed', 'archived'].includes(project.status)) {
    throw new ApiError(409, 'Tasks cannot be added to a completed or archived project');
  }
  if (!(await canCreateTask({ companyId, project, actor, workAccess }))) {
    throw new ApiError(403, 'You cannot create tasks in this project');
  }
  await assertAssignees(companyId, project._id, payload.assigneeIds);
  if (payload.status === 'approved') throw new ApiError(409, 'Submit the task through the approval workflow');
  if (
    payload.paymentAmount > 0
    && !(await canManageProject({ project, companyId, userId: actor._id, workAccess }))
  ) {
    throw new ApiError(403, 'Only a project manager or administrator can set task payment');
  }

  let task;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      task = await Task.create({
        companyId,
        workspaceId: project.workspaceId,
        projectId: project._id,
        key: taskKey(project.key),
        type: payload.type,
        title: payload.title,
        description: payload.description,
        assigneeIds: [...new Set(payload.assigneeIds)],
        createdBy: actor._id,
        priority: payload.priority,
        status: payload.status,
        approvalStatus: 'not_submitted',
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        completedAt: payload.status === 'completed' ? new Date() : null,
        estimatedHours: payload.estimatedHours,
        paymentAmount: payload.paymentAmount,
        tags: [...new Set(payload.tags.map((tag) => tag.toLowerCase()))],
        issueDetails: payload.issueDetails,
        order: await nextOrder(companyId, project._id, payload.status),
      });
      break;
    } catch (error) {
      if (error?.code !== 11000 || attempt === 2) throw error;
    }
  }
  await Promise.all([
    audit({ companyId, task, actor, action: 'work_task_created', ip }),
    refreshProjectProgress(companyId, project._id),
  ]);
  return getTask({ companyId, taskId: task._id, actor, workAccess });
}

async function listTasks({ companyId, actor, workAccess, query }) {
  requireCompanyId(companyId);
  const {
    page, limit, search, projectId, workspaceId, assigneeId, status, priority, type, due, mine,
  } = query;
  const projectIds = await accessibleProjectIds(companyId, actor, workAccess);
  const filter = { companyId, projectId: { $in: projectIds }, deletedAt: null };
  if (projectId) {
    if (!projectIds.some((id) => String(id) === String(projectId))) {
      return paginatedResponse([], { page, limit, total: 0 });
    }
    filter.projectId = projectId;
  }
  if (workspaceId) filter.workspaceId = workspaceId;
  if (assigneeId) filter.assigneeIds = assigneeId;
  if (mine === 'true') filter.assigneeIds = actor._id;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (type) filter.type = type;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { key: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      { tags: { $regex: safeSearch, $options: 'i' } },
    ];
  }
  dueRange(filter, due);
  if (due === 'overdue') filter.status = { $ne: 'completed' };

  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('projectId', 'name key color managerId')
      .populate('workspaceId', 'name color')
      .populate('assigneeIds', 'name email avatar workAccess')
      .populate('createdBy', 'name avatar')
      .sort({ dueDate: 1, priority: -1, updatedAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
  ]);
  return paginatedResponse(tasks.map((task) => (
    canViewTaskPayment({ task, actor, workAccess })
      ? withTaskPaymentDefaults(task)
      : hideTaskPayment(task)
  )), { page, limit, total });
}

async function getTask({ companyId, taskId, actor, workAccess }) {
  requireCompanyId(companyId);
  const taskDocument = await findTask(companyId, taskId);
  const project = await assertTaskVisible({ companyId, task: taskDocument, actor, workAccess });
  const [task, subtasks, editScope] = await Promise.all([
    Task.findById(taskDocument._id)
      .populate('projectId', 'name key color managerId')
      .populate('workspaceId', 'name color')
      .populate('assigneeIds', 'name email avatar workAccess')
      .populate('createdBy', 'name avatar')
      .lean(),
    SubTask.find({ companyId, taskId, deletedAt: null })
      .populate('assigneeId', 'name email avatar')
      .sort({ order: 1, createdAt: 1 })
      .lean(),
    taskEditScope({ companyId, task: taskDocument, project, actor, workAccess }),
  ]);
  const response = {
    ...task,
    subtasks,
    access: {
      canEdit: Boolean(editScope),
      canManage: editScope === 'manage',
      canApprove: Boolean(workAccess?.permissions?.approveTasks),
    },
  };
  return canViewTaskPayment({ task, actor, workAccess, editScope })
    ? withTaskPaymentDefaults(response)
    : hideTaskPayment(response);
}

async function updateTask({ companyId, taskId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const task = await findTask(companyId, taskId);
  const project = await assertTaskVisible({ companyId, task, actor, workAccess });
  const editScope = await taskEditScope({ companyId, task, project, actor, workAccess });
  if (!editScope) throw new ApiError(403, 'You cannot update this task');

  if (editScope === 'assignee') {
    const allowedFields = new Set(['status', 'actualHours']);
    if (Object.keys(payload).some((field) => !allowedFields.has(field))) {
      throw new ApiError(403, 'Assignees can update only task status and actual hours');
    }
  }
  if (payload.paymentAmount !== undefined && editScope !== 'manage') {
    throw new ApiError(403, 'Only a project manager or administrator can update task payment');
  }
  if (payload.status === 'approved') throw new ApiError(409, 'Use the approval workflow to approve this task');
  if (payload.assigneeIds) await assertAssignees(companyId, project._id, payload.assigneeIds);

  const nextStart = payload.startDate === undefined ? task.startDate : payload.startDate && new Date(payload.startDate);
  const nextDue = payload.dueDate === undefined ? task.dueDate : payload.dueDate && new Date(payload.dueDate);
  if (nextStart && nextDue && nextDue < nextStart) throw new ApiError(400, 'Due date cannot be before start date');

  const changes = [];
  for (const [field, rawValue] of Object.entries(payload)) {
    let value = rawValue;
    if (['startDate', 'dueDate'].includes(field)) value = rawValue ? new Date(rawValue) : null;
    if (field === 'tags') value = [...new Set(rawValue.map((tag) => tag.toLowerCase()))];
    if (field === 'assigneeIds') value = [...new Set(rawValue)];
    if (field === 'issueDetails') value = { ...task.issueDetails.toObject(), ...rawValue };
    const oldValue = field === 'issueDetails' ? task.issueDetails.toObject() : task[field];
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      changes.push({ field, oldValue, newValue: value });
      task[field] = value;
    }
  }
  if (payload.status) {
    task.completedAt = payload.status === 'completed' ? (task.completedAt || new Date()) : null;
  }
  await task.save();
  if (changes.length) {
    await audit({ companyId, task, actor, action: 'work_task_updated', ip, changes });
  }
  if (payload.status) await refreshProjectProgress(companyId, project._id);
  return getTask({ companyId, taskId, actor, workAccess });
}

async function moveTask({ companyId, taskId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const task = await findTask(companyId, taskId);
  const project = await assertTaskVisible({ companyId, task, actor, workAccess });
  const editScope = await taskEditScope({ companyId, task, project, actor, workAccess });
  if (!editScope) throw new ApiError(403, 'You cannot move this task');
  if (payload.status === 'approved') throw new ApiError(409, 'Use the approval workflow to approve this task');
  const oldStatus = task.status;
  const oldOrder = task.order;
  task.status = payload.status;
  task.order = payload.order ?? await nextOrder(companyId, project._id, payload.status);
  task.completedAt = payload.status === 'completed' ? (task.completedAt || new Date()) : null;
  await task.save();
  await Promise.all([
    audit({
      companyId,
      task,
      actor,
      action: 'work_task_moved',
      ip,
      changes: [
        { field: 'status', oldValue: oldStatus, newValue: task.status },
        { field: 'order', oldValue: oldOrder, newValue: task.order },
      ],
    }),
    refreshProjectProgress(companyId, project._id),
  ]);
  return getTask({ companyId, taskId, actor, workAccess });
}

async function getBoard({ companyId, actor, workAccess, projectId }) {
  requireCompanyId(companyId);
  const project = await findProject(companyId, projectId);
  if (!(await canViewProject({ project, companyId, userId: actor._id, workAccess }))) {
    throw new ApiError(404, 'Project not found');
  }
  const tasks = await Task.find({ companyId, projectId, deletedAt: null })
    .populate('assigneeIds', 'name avatar')
    .sort({ status: 1, order: 1, createdAt: 1 })
    .lean();
  return {
    project: {
      _id: project._id,
      key: project.key,
      name: project.name,
      color: project.color,
      progress: project.progress,
    },
    tasks: tasks.map((task) => (
      canViewTaskPayment({ task: { ...task, projectId: project }, actor, workAccess })
        ? withTaskPaymentDefaults(task)
        : hideTaskPayment(task)
    )),
  };
}

async function deleteTask({ companyId, taskId, actor, workAccess, ip }) {
  requireCompanyId(companyId);
  const task = await findTask(companyId, taskId);
  const project = await assertTaskVisible({ companyId, task, actor, workAccess });
  const editScope = await taskEditScope({ companyId, task, project, actor, workAccess });
  if (!['manage', 'creator'].includes(editScope)) throw new ApiError(403, 'You cannot delete this task');
  const deletedAt = new Date();
  task.deletedAt = deletedAt;
  task.deletedBy = actor._id;
  await task.save();
  await Promise.all([
    SubTask.updateMany(
      { companyId, taskId, deletedAt: null },
      { $set: { deletedAt, deletedBy: actor._id } },
    ),
    Comment.updateMany(
      { companyId, taskId, deletedAt: null },
      { $set: { deletedAt, deletedBy: actor._id } },
    ),
    Attachment.updateMany(
      { companyId, taskId, deletedAt: null },
      { $set: { deletedAt, deletedBy: actor._id } },
    ),
    Approval.updateMany(
      { companyId, taskId, status: 'pending' },
      { $set: { status: 'cancelled', reviewedBy: actor._id, reviewedAt: deletedAt, reviewNote: 'Task deleted' } },
    ),
    audit({ companyId, task, actor, action: 'work_task_deleted', ip }),
    refreshProjectProgress(companyId, project._id),
  ]);
}

async function refreshSubtaskCounts(companyId, taskId) {
  const [counts] = await SubTask.aggregate([
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
        taskId: new mongoose.Types.ObjectId(taskId),
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$completed', 1, 0] } },
      },
    },
  ]);
  await Task.updateOne(
    { _id: taskId, companyId },
    { $set: { subtaskCount: counts?.total || 0, completedSubtaskCount: counts?.completed || 0 } },
  );
}

async function createSubTask({ companyId, taskId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const task = await findTask(companyId, taskId);
  const project = await assertTaskVisible({ companyId, task, actor, workAccess });
  if (!(await taskEditScope({ companyId, task, project, actor, workAccess }))) {
    throw new ApiError(403, 'You cannot add subtasks here');
  }
  if (payload.assigneeId) await assertAssignees(companyId, project._id, [payload.assigneeId]);
  const last = await SubTask.findOne({ companyId, taskId, deletedAt: null }).sort({ order: -1 }).select('order').lean();
  const subtask = await SubTask.create({
    companyId,
    workspaceId: task.workspaceId,
    projectId: task.projectId,
    taskId,
    title: payload.title,
    assigneeId: payload.assigneeId || null,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
    order: (last?.order || 0) + 1000,
    createdBy: actor._id,
  });
  await refreshSubtaskCounts(companyId, taskId);
  await audit({
    companyId,
    task,
    actor,
    action: 'work_subtask_created',
    ip,
    meta: { subTaskId: subtask._id, subTaskTitle: subtask.title },
  });
  return subtask.populate('assigneeId', 'name email avatar');
}

async function updateSubTask({ companyId, taskId, subTaskId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const task = await findTask(companyId, taskId);
  const project = await assertTaskVisible({ companyId, task, actor, workAccess });
  if (!(await taskEditScope({ companyId, task, project, actor, workAccess }))) {
    throw new ApiError(403, 'You cannot update subtasks here');
  }
  const subtask = await SubTask.findOne({ _id: subTaskId, taskId, companyId, deletedAt: null });
  if (!subtask) throw new ApiError(404, 'Subtask not found');
  if (payload.assigneeId) await assertAssignees(companyId, project._id, [payload.assigneeId]);

  const changes = [];
  for (const [field, rawValue] of Object.entries(payload)) {
    const value = field === 'dueDate' ? (rawValue ? new Date(rawValue) : null) : rawValue;
    if (JSON.stringify(subtask[field]) !== JSON.stringify(value)) {
      changes.push({ field, oldValue: subtask[field], newValue: value });
      subtask[field] = value;
    }
  }
  if (payload.completed !== undefined) subtask.completedAt = payload.completed ? new Date() : null;
  await subtask.save();
  await refreshSubtaskCounts(companyId, taskId);
  if (changes.length) {
    await audit({
      companyId,
      task,
      actor,
      action: 'work_subtask_updated',
      ip,
      changes,
      meta: { subTaskId: subtask._id, subTaskTitle: subtask.title },
    });
  }
  return subtask.populate('assigneeId', 'name email avatar');
}

async function deleteSubTask({ companyId, taskId, subTaskId, actor, workAccess, ip }) {
  requireCompanyId(companyId);
  const task = await findTask(companyId, taskId);
  const project = await assertTaskVisible({ companyId, task, actor, workAccess });
  if (!(await taskEditScope({ companyId, task, project, actor, workAccess }))) {
    throw new ApiError(403, 'You cannot delete subtasks here');
  }
  const subtask = await SubTask.findOne({ _id: subTaskId, taskId, companyId, deletedAt: null });
  if (!subtask) throw new ApiError(404, 'Subtask not found');
  subtask.deletedAt = new Date();
  subtask.deletedBy = actor._id;
  await subtask.save();
  await refreshSubtaskCounts(companyId, taskId);
  await audit({
    companyId,
    task,
    actor,
    action: 'work_subtask_deleted',
    ip,
    meta: { subTaskId: subtask._id, subTaskTitle: subtask.title },
  });
}

module.exports = {
  accessibleProjectIds,
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getBoard,
  getTask,
  getTaskAccessContext,
  listTasks,
  moveTask,
  refreshProjectProgress,
  updateSubTask,
  updateTask,
};
