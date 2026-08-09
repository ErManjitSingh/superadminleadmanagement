const asyncHandler = require('../../utils/asyncHandler');
const projectService = require('../services/projectService');

const context = (req) => ({
  companyId: req.companyId,
  actor: req.user,
  workAccess: req.workAccess,
  ip: req.ip,
});

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject({ ...context(req), payload: req.body });
  res.status(201).json({ success: true, project });
});

const listProjects = asyncHandler(async (req, res) => {
  const result = await projectService.listProjects({ ...context(req), query: req.query });
  res.json({ success: true, ...result });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProject({ ...context(req), projectId: req.params.projectId });
  res.json({ success: true, project });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject({
    ...context(req),
    projectId: req.params.projectId,
    payload: req.body,
  });
  res.json({ success: true, project });
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject({ ...context(req), projectId: req.params.projectId });
  res.status(204).send();
});

const addProjectMember = asyncHandler(async (req, res) => {
  const member = await projectService.addProjectMember({
    ...context(req),
    projectId: req.params.projectId,
    payload: req.body,
  });
  res.status(201).json({ success: true, member });
});

const updateProjectMember = asyncHandler(async (req, res) => {
  const member = await projectService.updateProjectMember({
    ...context(req),
    projectId: req.params.projectId,
    userId: req.params.userId,
    payload: req.body,
  });
  res.json({ success: true, member });
});

const removeProjectMember = asyncHandler(async (req, res) => {
  await projectService.removeProjectMember({
    ...context(req),
    projectId: req.params.projectId,
    userId: req.params.userId,
  });
  res.status(204).send();
});

module.exports = {
  addProjectMember,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  removeProjectMember,
  updateProject,
  updateProjectMember,
};
