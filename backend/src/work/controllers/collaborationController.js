const asyncHandler = require('../../utils/asyncHandler');
const collaborationService = require('../services/collaborationService');

const context = (req) => ({
  companyId: req.companyId,
  actor: req.user,
  workAccess: req.workAccess,
  ip: req.ip,
});

const submitApproval = asyncHandler(async (req, res) => {
  const approvals = await collaborationService.submitApproval({
    ...context(req),
    taskId: req.params.taskId,
    payload: req.body,
  });
  res.status(201).json({ success: true, approvals });
});

const listApprovals = asyncHandler(async (req, res) => {
  const result = await collaborationService.listApprovals({
    ...context(req),
    query: req.query,
  });
  res.json({ success: true, ...result });
});

const reviewApproval = asyncHandler(async (req, res) => {
  const approval = await collaborationService.reviewApproval({
    ...context(req),
    approvalId: req.params.approvalId,
    payload: req.body,
  });
  res.json({ success: true, approval });
});

const getApprovalHistory = asyncHandler(async (req, res) => {
  const approvals = await collaborationService.getApprovalHistory({
    ...context(req),
    taskId: req.params.taskId,
  });
  res.json({ success: true, approvals });
});

const createComment = asyncHandler(async (req, res) => {
  const comment = await collaborationService.createComment({
    ...context(req),
    taskId: req.params.taskId,
    payload: req.body,
  });
  res.status(201).json({ success: true, comment });
});

const listComments = asyncHandler(async (req, res) => {
  const result = await collaborationService.listComments({
    ...context(req),
    taskId: req.params.taskId,
    query: req.query,
  });
  res.json({ success: true, ...result });
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await collaborationService.updateComment({
    ...context(req),
    taskId: req.params.taskId,
    commentId: req.params.commentId,
    payload: req.body,
  });
  res.json({ success: true, comment });
});

const deleteComment = asyncHandler(async (req, res) => {
  await collaborationService.deleteComment({
    ...context(req),
    taskId: req.params.taskId,
    commentId: req.params.commentId,
  });
  res.status(204).send();
});

const uploadAttachments = asyncHandler(async (req, res) => {
  const attachments = await collaborationService.uploadAttachments({
    ...context(req),
    taskId: req.params.taskId,
    files: req.files,
  });
  res.status(201).json({ success: true, attachments });
});

const listAttachments = asyncHandler(async (req, res) => {
  const attachments = await collaborationService.listAttachments({
    ...context(req),
    taskId: req.params.taskId,
  });
  res.json({ success: true, attachments });
});

const downloadAttachment = asyncHandler(async (req, res, next) => {
  const { attachment, absolutePath } = await collaborationService.getAttachmentDownload({
    ...context(req),
    taskId: req.params.taskId,
    attachmentId: req.params.attachmentId,
  });
  res.download(absolutePath, attachment.originalName, (error) => {
    if (error && !res.headersSent) next(error);
  });
});

const deleteAttachment = asyncHandler(async (req, res) => {
  await collaborationService.deleteAttachment({
    ...context(req),
    taskId: req.params.taskId,
    attachmentId: req.params.attachmentId,
  });
  res.status(204).send();
});

const listActivity = asyncHandler(async (req, res) => {
  const result = await collaborationService.listActivity({
    ...context(req),
    taskId: req.params.taskId,
    query: req.query,
  });
  res.json({ success: true, ...result });
});

module.exports = {
  createComment,
  deleteAttachment,
  deleteComment,
  downloadAttachment,
  getApprovalHistory,
  listActivity,
  listApprovals,
  listAttachments,
  listComments,
  reviewApproval,
  submitApproval,
  updateComment,
  uploadAttachments,
};
