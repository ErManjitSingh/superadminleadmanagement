const WorkspaceMember = require('../models/WorkspaceMember');
const ProjectMember = require('../models/ProjectMember');

function isWorkAdmin(workAccess) {
  return workAccess?.enabled && workAccess.role === 'admin';
}

async function getWorkspaceMembership({ companyId, workspaceId, userId }) {
  return WorkspaceMember.findOne({ companyId, workspaceId, userId }).lean();
}

async function canViewWorkspace(context) {
  if (isWorkAdmin(context.workAccess)) return true;
  return Boolean(await getWorkspaceMembership(context));
}

async function canManageWorkspace(context) {
  if (isWorkAdmin(context.workAccess)) return true;
  const membership = await getWorkspaceMembership(context);
  return ['owner', 'admin'].includes(membership?.role);
}

async function canCreateProject(context) {
  if (isWorkAdmin(context.workAccess)) return true;
  if (!context.workAccess?.permissions?.manageProjects) return false;
  const membership = await getWorkspaceMembership(context);
  return ['owner', 'admin', 'project_manager'].includes(membership?.role);
}

async function getProjectMembership({ companyId, projectId, userId }) {
  return ProjectMember.findOne({ companyId, projectId, userId }).lean();
}

async function canViewProject({ project, companyId, userId, workAccess }) {
  if (isWorkAdmin(workAccess)) return true;
  const workspaceId = project.workspaceId?._id || project.workspaceId;
  const projectMembership = await getProjectMembership({ companyId, projectId: project._id, userId });
  if (projectMembership) return true;
  if (project.visibility === 'members') return false;
  return canViewWorkspace({ companyId, workspaceId, userId, workAccess });
}

async function canManageProject({ project, companyId, userId, workAccess }) {
  if (isWorkAdmin(workAccess)) return true;
  if (!workAccess?.permissions?.manageProjects) return false;
  const managerId = project.managerId?._id || project.managerId;
  const workspaceId = project.workspaceId?._id || project.workspaceId;
  if (String(managerId) === String(userId)) return true;
  const projectMembership = await getProjectMembership({ companyId, projectId: project._id, userId });
  if (projectMembership?.role === 'manager') return true;
  const workspaceMembership = await getWorkspaceMembership({
    companyId,
    workspaceId,
    userId,
  });
  return ['owner', 'admin', 'project_manager'].includes(workspaceMembership?.role);
}

module.exports = {
  canCreateProject,
  canManageProject,
  canManageWorkspace,
  canViewProject,
  canViewWorkspace,
  getProjectMembership,
  getWorkspaceMembership,
  isWorkAdmin,
};
