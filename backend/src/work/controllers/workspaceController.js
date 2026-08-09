const asyncHandler = require('../../utils/asyncHandler');
const workspaceService = require('../services/workspaceService');

const context = (req) => ({
  companyId: req.companyId,
  actor: req.user,
  workAccess: req.workAccess,
  ip: req.ip,
});

const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.createWorkspace({ ...context(req), payload: req.body });
  res.status(201).json({ success: true, workspace });
});

const listWorkspaces = asyncHandler(async (req, res) => {
  const result = await workspaceService.listWorkspaces({ ...context(req), query: req.query });
  res.json({ success: true, ...result });
});

const getWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getWorkspace({
    ...context(req),
    workspaceId: req.params.workspaceId,
  });
  res.json({ success: true, workspace });
});

const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateWorkspace({
    ...context(req),
    workspaceId: req.params.workspaceId,
    payload: req.body,
  });
  res.json({ success: true, workspace });
});

const deleteWorkspace = asyncHandler(async (req, res) => {
  await workspaceService.deleteWorkspace({
    ...context(req),
    workspaceId: req.params.workspaceId,
  });
  res.status(204).send();
});

const addWorkspaceMember = asyncHandler(async (req, res) => {
  const member = await workspaceService.addWorkspaceMember({
    ...context(req),
    workspaceId: req.params.workspaceId,
    payload: req.body,
  });
  res.status(201).json({ success: true, member });
});

const updateWorkspaceMember = asyncHandler(async (req, res) => {
  const member = await workspaceService.updateWorkspaceMember({
    ...context(req),
    workspaceId: req.params.workspaceId,
    userId: req.params.userId,
    payload: req.body,
  });
  res.json({ success: true, member });
});

const removeWorkspaceMember = asyncHandler(async (req, res) => {
  await workspaceService.removeWorkspaceMember({
    ...context(req),
    workspaceId: req.params.workspaceId,
    userId: req.params.userId,
  });
  res.status(204).send();
});

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
