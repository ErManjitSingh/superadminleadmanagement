const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const AuditLog = require('../../models/AuditLog');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { notifyUsers } = require('../../services/notificationService');
const ApiError = require('../../utils/apiError');
const { paginatedResponse } = require('../../utils/pagination');
const Approval = require('../models/Approval');
const Attachment = require('../models/Attachment');
const Comment = require('../models/Comment');
const ProjectMember = require('../models/ProjectMember');
const WorkspaceMember = require('../models/WorkspaceMember');
const WorkActivityLog = require('../models/ActivityLog');
const {
  accessibleProjectIds,
  getTaskAccessContext,
  refreshProjectProgress,
} = require('./taskService');
const { canManageProject, isWorkAdmin } = require('./resourceAccessService');

const PRIVATE_UPLOAD_ROOT = path.resolve(__dirname, '../../../private-work-uploads');

function requireCompanyId(companyId) {
  if (!companyId) throw new ApiError(403, 'Tenant context is required');
  return companyId;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeOriginalName(value) {
  return path.basename(value || 'attachment').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255);
}

function assertFileSignature(file) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const buffer = file.buffer;
  const starts = (...bytes) => bytes.every((byte, index) => buffer[index] === byte);
  const signatures = {
    '.jpg': starts(0xff, 0xd8, 0xff),
    '.jpeg': starts(0xff, 0xd8, 0xff),
    '.png': starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
    '.gif': buffer.subarray(0, 4).toString('ascii') === 'GIF8',
    '.webp': buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP',
    '.pdf': buffer.subarray(0, 5).toString('ascii') === '%PDF-',
    '.zip': starts(0x50, 0x4b),
    '.docx': starts(0x50, 0x4b),
    '.xlsx': starts(0x50, 0x4b),
    '.pptx': starts(0x50, 0x4b),
    '.doc': starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1),
    '.xls': starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1),
    '.ppt': starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1),
    '.txt': !buffer.includes(0),
    '.csv': !buffer.includes(0),
  };
  if (!signatures[extension]) throw new ApiError(400, `${file.originalname} does not match its file type`);
}

async function recordActivity({ companyId, task, actor, action, summary, ip, meta = {}, changes = [] }) {
  await Promise.all([
    WorkActivityLog.create({
      companyId,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task._id,
      actorId: actor._id,
      action,
      summary,
      meta,
    }),
    AuditLog.create({
      companyId,
      entityType: 'work_task',
      entityId: task._id,
      action,
      actorId: actor._id,
      actorName: actor.name,
      changes,
      ip,
      meta: { taskKey: task.key, taskTitle: task.title, projectId: task.projectId, ...meta },
    }),
  ]);
}

async function notifyWorkUsers(userIds, { companyId, type, title, message, taskId, meta = {} }) {
  const unique = [...new Set(userIds.map(String))].filter(Boolean);
  if (!unique.length) return;
  await notifyUsers(unique, {
    companyId,
    type,
    title,
    message,
    meta: {
      taskId,
      href: `/task/tasks/${taskId}`,
      ...meta,
    },
  });
}

async function approvalRecipientIds({ companyId, task, project, actor }) {
  const [workspaceApprovers, companyAdmins] = await Promise.all([
    WorkspaceMember.find({
      companyId,
      workspaceId: task.workspaceId,
      role: { $in: ['owner', 'admin', 'project_manager'] },
    }).distinct('userId'),
    User.find({
      companyId,
      status: 'active',
      'workAccess.enabled': { $ne: false },
      $or: [
        { 'workAccess.role': 'admin' },
        {
          'workAccess.role': { $in: [null] },
          role: 'admin',
        },
      ],
    }).distinct('_id'),
  ]);
  const candidates = [...new Set([
    String(project.managerId),
    ...workspaceApprovers.map(String),
    ...companyAdmins.map(String),
  ])].filter((id) => id !== String(actor._id));
  return User.find({
    _id: { $in: candidates },
    companyId,
    status: 'active',
    'workAccess.enabled': { $ne: false },
    $or: [
      { 'workAccess.role': { $in: ['admin', 'project_manager'] } },
      {
        'workAccess.role': { $in: [null] },
        role: { $in: ['admin', 'sales_manager', 'operations_manager'] },
      },
    ],
  }).distinct('_id');
}

async function submitApproval({ companyId, taskId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const { task, project, editScope } = await getTaskAccessContext({
    companyId, taskId, actor, workAccess,
  });
  if (!editScope) throw new ApiError(403, 'You cannot submit this task for approval');
  if (task.approvalStatus === 'pending') throw new ApiError(409, 'This task is already awaiting approval');
  if (task.status === 'completed') throw new ApiError(409, 'A completed task cannot be submitted for approval');

  const latest = await Approval.findOne({ companyId, taskId }).sort({ revision: -1 }).select('revision').lean();
  const approval = await Approval.create({
    companyId,
    workspaceId: task.workspaceId,
    projectId: task.projectId,
    taskId: task._id,
    revision: (latest?.revision || 0) + 1,
    submittedBy: actor._id,
    submissionNote: payload.note,
  });
  task.approvalStatus = 'pending';
  task.status = 'review';
  task.completedAt = null;
  await task.save();

  const recipients = await approvalRecipientIds({ companyId, task, project, actor });
  await Promise.all([
    recordActivity({
      companyId,
      task,
      actor,
      action: 'work_approval_submitted',
      summary: `${actor.name} submitted ${task.key} for approval`,
      ip,
      meta: { approvalId: approval._id, revision: approval.revision },
    }),
    notifyWorkUsers(recipients, {
      companyId,
      type: 'work_approval_requested',
      title: 'Task awaiting approval',
      message: `${actor.name} submitted ${task.key}: ${task.title}`,
      taskId: task._id,
      meta: { approvalId: approval._id },
    }),
  ]);
  return getApprovalHistory({ companyId, taskId, actor, workAccess });
}

async function listApprovals({ companyId, actor, workAccess, query }) {
  requireCompanyId(companyId);
  const { page, limit, status, projectId, submittedBy, search } = query;
  const projectIds = await accessibleProjectIds(companyId, actor, workAccess);
  const filter = { companyId, projectId: { $in: projectIds } };
  const canApprove = Boolean(workAccess?.permissions?.approveTasks);
  if (!canApprove) filter.submittedBy = actor._id;
  if (status) filter.status = status;
  if (projectId) {
    filter.projectId = projectIds.some((id) => String(id) === String(projectId))
      ? projectId
      : { $in: [] };
  }
  if (submittedBy && canApprove) filter.submittedBy = submittedBy;

  if (search) {
    const safeSearch = escapeRegex(search);
    const taskIds = await require('../models/Task').find({
      companyId,
      projectId: { $in: projectIds },
      deletedAt: null,
      $or: [
        { title: { $regex: safeSearch, $options: 'i' } },
        { key: { $regex: safeSearch, $options: 'i' } },
      ],
    }).distinct('_id');
    filter.taskId = { $in: taskIds };
  }

  const skip = (page - 1) * limit;
  const [approvals, total] = await Promise.all([
    Approval.find(filter)
      .populate('taskId', 'key title priority status dueDate assigneeIds')
      .populate('projectId', 'key name color managerId')
      .populate('submittedBy', 'name email avatar')
      .populate('reviewedBy', 'name email avatar')
      .sort({ submittedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Approval.countDocuments(filter),
  ]);
  return paginatedResponse(approvals, { page, limit, total });
}

async function reviewApproval({ companyId, approvalId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  if (!workAccess?.permissions?.approveTasks) throw new ApiError(403, 'Approval permission is required');
  const approval = await Approval.findOne({ _id: approvalId, companyId, status: 'pending' });
  if (!approval) throw new ApiError(404, 'Pending approval not found');
  const { task, project } = await getTaskAccessContext({
    companyId,
    taskId: approval.taskId,
    actor,
    workAccess,
  });
  const canManage = await canManageProject({ project, companyId, userId: actor._id, workAccess });
  if (!canManage) throw new ApiError(403, 'You cannot review approvals for this project');
  if (String(approval.submittedBy) === String(actor._id) && !isWorkAdmin(workAccess)) {
    throw new ApiError(409, 'The submitter cannot review their own work');
  }

  approval.status = payload.decision;
  approval.reviewedBy = actor._id;
  approval.reviewNote = payload.note;
  approval.reviewedAt = new Date();
  await approval.save();
  try {
    task.approvalStatus = payload.decision;
    task.status = payload.decision === 'approved' ? 'approved' : 'in_progress';
    task.completedAt = null;
    await task.save();
  } catch (error) {
    await Approval.updateOne(
      { _id: approval._id, companyId },
      { $set: { status: 'pending', reviewedBy: null, reviewNote: '', reviewedAt: null } },
    );
    throw error;
  }

  await Promise.all([
    recordActivity({
      companyId,
      task,
      actor,
      action: `work_approval_${payload.decision}`,
      summary: `${actor.name} ${payload.decision} ${task.key}`,
      ip,
      meta: { approvalId: approval._id, note: payload.note },
    }),
    notifyWorkUsers([approval.submittedBy], {
      companyId,
      type: `work_approval_${payload.decision}`,
      title: `Task ${payload.decision}`,
      message: `${actor.name} ${payload.decision} ${task.key}${payload.note ? `: ${payload.note}` : ''}`,
      taskId: task._id,
      meta: { approvalId: approval._id },
    }),
    refreshProjectProgress(companyId, task.projectId),
  ]);
  return approval.populate([
    { path: 'taskId', select: 'key title priority status dueDate assigneeIds' },
    { path: 'projectId', select: 'key name color managerId' },
    { path: 'submittedBy', select: 'name email avatar' },
    { path: 'reviewedBy', select: 'name email avatar' },
  ]);
}

async function getApprovalHistory({ companyId, taskId, actor, workAccess }) {
  requireCompanyId(companyId);
  await getTaskAccessContext({ companyId, taskId, actor, workAccess });
  return Approval.find({ companyId, taskId })
    .populate('submittedBy', 'name email avatar')
    .populate('reviewedBy', 'name email avatar')
    .sort({ revision: -1 })
    .lean();
}

async function assertMentionUsers(companyId, project, mentionIds) {
  const uniqueIds = [...new Set(mentionIds.map(String))];
  if (!uniqueIds.length) return [];
  const [projectMembers, workspaceMembers] = await Promise.all([
    ProjectMember.find({ companyId, projectId: project._id, userId: { $in: uniqueIds } }).distinct('userId'),
    WorkspaceMember.find({
      companyId,
      workspaceId: project.workspaceId,
      userId: { $in: uniqueIds },
    }).distinct('userId'),
  ]);
  const valid = new Set([
    String(project.managerId),
    ...projectMembers.map(String),
    ...workspaceMembers.map(String),
  ]);
  if (uniqueIds.some((id) => !valid.has(id))) {
    throw new ApiError(400, 'Mentioned users must belong to this project or workspace');
  }
  return uniqueIds;
}

async function createComment({ companyId, taskId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const { task, project } = await getTaskAccessContext({ companyId, taskId, actor, workAccess });
  const mentionIds = await assertMentionUsers(companyId, project, payload.mentionIds);
  if (payload.parentCommentId) {
    const parent = await Comment.findOne({
      _id: payload.parentCommentId,
      companyId,
      taskId,
      deletedAt: null,
    }).select('_id parentCommentId').lean();
    if (!parent) throw new ApiError(404, 'Parent comment not found');
    if (parent.parentCommentId) throw new ApiError(400, 'Replies can be nested only one level');
  }
  const comment = await Comment.create({
    companyId,
    workspaceId: task.workspaceId,
    projectId: task.projectId,
    taskId,
    authorId: actor._id,
    body: payload.body,
    parentCommentId: payload.parentCommentId || null,
    mentionIds,
  });
  await require('../models/Task').updateOne({ _id: taskId, companyId }, { $inc: { commentCount: 1 } });

  const mentions = mentionIds.filter((id) => id !== String(actor._id));
  const mentionedSet = new Set(mentions);
  const watchers = task.assigneeIds
    .map(String)
    .filter((id) => id !== String(actor._id) && !mentionedSet.has(id));
  await Promise.all([
    recordActivity({
      companyId,
      task,
      actor,
      action: 'work_comment_created',
      summary: `${actor.name} commented on ${task.key}`,
      ip,
      meta: { commentId: comment._id, parentCommentId: comment.parentCommentId },
    }),
    notifyWorkUsers(mentions, {
      companyId,
      type: 'work_user_mentioned',
      title: 'You were mentioned',
      message: `${actor.name} commented on ${task.key}: ${payload.body.slice(0, 120)}`,
      taskId: task._id,
      meta: { commentId: comment._id, mentionIds },
    }),
    notifyWorkUsers(watchers, {
      companyId,
      type: 'work_task_commented',
      title: 'New task comment',
      message: `${actor.name} commented on ${task.key}: ${payload.body.slice(0, 120)}`,
      taskId: task._id,
      meta: { commentId: comment._id },
    }),
  ]);
  return comment.populate([
    { path: 'authorId', select: 'name email avatar workAccess' },
    { path: 'mentionIds', select: 'name email avatar' },
  ]);
}

async function listComments({ companyId, taskId, actor, workAccess, query }) {
  requireCompanyId(companyId);
  await getTaskAccessContext({ companyId, taskId, actor, workAccess });
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const filter = { companyId, taskId, deletedAt: null };
  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .populate('authorId', 'name email avatar workAccess')
      .populate('mentionIds', 'name email avatar')
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments(filter),
  ]);
  return paginatedResponse(comments, { page, limit, total });
}

async function updateComment({ companyId, taskId, commentId, actor, workAccess, payload, ip }) {
  requireCompanyId(companyId);
  const { task, project } = await getTaskAccessContext({ companyId, taskId, actor, workAccess });
  const comment = await Comment.findOne({ _id: commentId, companyId, taskId, deletedAt: null });
  if (!comment) throw new ApiError(404, 'Comment not found');
  const canManage = await canManageProject({ project, companyId, userId: actor._id, workAccess });
  if (String(comment.authorId) !== String(actor._id) && !canManage) {
    throw new ApiError(403, 'You cannot edit this comment');
  }
  const mentionIds = await assertMentionUsers(companyId, project, payload.mentionIds);
  const oldBody = comment.body;
  comment.body = payload.body;
  comment.mentionIds = mentionIds;
  comment.editedAt = new Date();
  await comment.save();
  await recordActivity({
    companyId,
    task,
    actor,
    action: 'work_comment_updated',
    summary: `${actor.name} edited a comment on ${task.key}`,
    ip,
    meta: { commentId },
    changes: [{ field: 'comment.body', oldValue: oldBody, newValue: payload.body }],
  });
  return comment.populate([
    { path: 'authorId', select: 'name email avatar workAccess' },
    { path: 'mentionIds', select: 'name email avatar' },
  ]);
}

async function deleteComment({ companyId, taskId, commentId, actor, workAccess, ip }) {
  requireCompanyId(companyId);
  const { task, project } = await getTaskAccessContext({ companyId, taskId, actor, workAccess });
  const comment = await Comment.findOne({ _id: commentId, companyId, taskId, deletedAt: null });
  if (!comment) throw new ApiError(404, 'Comment not found');
  const canManage = await canManageProject({ project, companyId, userId: actor._id, workAccess });
  if (String(comment.authorId) !== String(actor._id) && !canManage) {
    throw new ApiError(403, 'You cannot delete this comment');
  }
  comment.deletedAt = new Date();
  comment.deletedBy = actor._id;
  await comment.save();
  await require('../models/Task').updateOne(
    { _id: taskId, companyId, commentCount: { $gt: 0 } },
    { $inc: { commentCount: -1 } },
  );
  await recordActivity({
    companyId,
    task,
    actor,
    action: 'work_comment_deleted',
    summary: `${actor.name} deleted a comment from ${task.key}`,
    ip,
    meta: { commentId },
  });
}

async function uploadAttachments({ companyId, taskId, actor, workAccess, files, ip }) {
  requireCompanyId(companyId);
  if (!files?.length) throw new ApiError(400, 'Select at least one file');
  const { task, editScope } = await getTaskAccessContext({ companyId, taskId, actor, workAccess });
  if (!editScope) throw new ApiError(403, 'You cannot upload files to this task');

  const directory = path.join(PRIVATE_UPLOAD_ROOT, String(companyId), String(taskId));
  await fs.mkdir(directory, { recursive: true });
  const created = [];
  try {
    for (const file of files) {
      assertFileSignature(file);
      const storageName = `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
      const absolutePath = path.join(directory, storageName);
      const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
      await fs.writeFile(absolutePath, file.buffer, { flag: 'wx' });
      try {
        const attachment = await Attachment.create({
          companyId,
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId,
          uploadedBy: actor._id,
          originalName: safeOriginalName(file.originalname),
          storageKey: path.relative(PRIVATE_UPLOAD_ROOT, absolutePath).replaceAll('\\', '/'),
          mimeType: file.mimetype,
          size: file.size,
          checksum,
        });
        created.push(attachment);
      } catch (error) {
        await fs.unlink(absolutePath).catch(() => {});
        throw error;
      }
    }
  } catch (error) {
    await Promise.all(created.map(async (attachment) => {
      await fs.unlink(path.join(PRIVATE_UPLOAD_ROOT, attachment.storageKey)).catch(() => {});
      await Attachment.deleteOne({ _id: attachment._id, companyId });
    }));
    throw error;
  }

  await require('../models/Task').updateOne(
    { _id: taskId, companyId },
    { $inc: { attachmentCount: created.length } },
  );
  await recordActivity({
    companyId,
    task,
    actor,
    action: 'work_attachments_uploaded',
    summary: `${actor.name} uploaded ${created.length} file${created.length === 1 ? '' : 's'} to ${task.key}`,
    ip,
    meta: { attachmentIds: created.map((item) => item._id), fileNames: created.map((item) => item.originalName) },
  });
  return Attachment.find({ _id: { $in: created.map((item) => item._id) }, companyId })
    .populate('uploadedBy', 'name email avatar')
    .lean();
}

async function listAttachments({ companyId, taskId, actor, workAccess }) {
  requireCompanyId(companyId);
  await getTaskAccessContext({ companyId, taskId, actor, workAccess });
  return Attachment.find({ companyId, taskId, deletedAt: null })
    .populate('uploadedBy', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();
}

async function getAttachmentDownload({ companyId, taskId, attachmentId, actor, workAccess }) {
  requireCompanyId(companyId);
  await getTaskAccessContext({ companyId, taskId, actor, workAccess });
  const attachment = await Attachment.findOne({
    _id: attachmentId,
    companyId,
    taskId,
    deletedAt: null,
  }).lean();
  if (!attachment) throw new ApiError(404, 'Attachment not found');
  const absolutePath = path.resolve(PRIVATE_UPLOAD_ROOT, attachment.storageKey);
  if (!absolutePath.startsWith(`${PRIVATE_UPLOAD_ROOT}${path.sep}`)) {
    throw new ApiError(500, 'Attachment storage path is invalid');
  }
  try {
    await fs.access(absolutePath);
  } catch {
    throw new ApiError(404, 'Attachment file is unavailable');
  }
  return { attachment, absolutePath };
}

async function deleteAttachment({ companyId, taskId, attachmentId, actor, workAccess, ip }) {
  requireCompanyId(companyId);
  const { task, project } = await getTaskAccessContext({ companyId, taskId, actor, workAccess });
  const attachment = await Attachment.findOne({
    _id: attachmentId,
    companyId,
    taskId,
    deletedAt: null,
  });
  if (!attachment) throw new ApiError(404, 'Attachment not found');
  const canManage = await canManageProject({ project, companyId, userId: actor._id, workAccess });
  if (String(attachment.uploadedBy) !== String(actor._id) && !canManage) {
    throw new ApiError(403, 'You cannot delete this attachment');
  }
  attachment.deletedAt = new Date();
  attachment.deletedBy = actor._id;
  await attachment.save();
  await require('../models/Task').updateOne(
    { _id: taskId, companyId, attachmentCount: { $gt: 0 } },
    { $inc: { attachmentCount: -1 } },
  );
  await recordActivity({
    companyId,
    task,
    actor,
    action: 'work_attachment_deleted',
    summary: `${actor.name} deleted ${attachment.originalName} from ${task.key}`,
    ip,
    meta: { attachmentId, originalName: attachment.originalName },
  });
}

async function listActivity({ companyId, taskId, actor, workAccess, query }) {
  requireCompanyId(companyId);
  await getTaskAccessContext({ companyId, taskId, actor, workAccess });
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const filter = { companyId, taskId };
  const [activities, total] = await Promise.all([
    WorkActivityLog.find(filter)
      .populate('actorId', 'name email avatar')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WorkActivityLog.countDocuments(filter),
  ]);
  return paginatedResponse(activities, { page, limit, total });
}

async function unreadWorkNotificationCount(companyId, userId) {
  return Notification.countDocuments({
    companyId,
    user: userId,
    read: false,
    type: { $regex: '^work_' },
  });
}

module.exports = {
  assertFileSignature,
  createComment,
  deleteAttachment,
  deleteComment,
  getApprovalHistory,
  getAttachmentDownload,
  listActivity,
  listApprovals,
  listAttachments,
  listComments,
  reviewApproval,
  submitApproval,
  unreadWorkNotificationCount,
  updateComment,
  uploadAttachments,
};
