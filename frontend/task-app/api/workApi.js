import API from '../../src/api/axios';

export async function fetchMyWorkAccess() {
  const response = await API.get('/work/access/me', { skipSuccessToast: true });
  return response.data;
}

export async function fetchWorkUsers(params = {}) {
  const response = await API.get('/work/users', {
    params,
    skipSuccessToast: true,
  });
  return response.data;
}

export async function updateWorkUserAccess(userId, payload) {
  const response = await API.patch(`/work/users/${userId}/access`, payload);
  return response.data;
}

export async function createWorkUser(payload) {
  const response = await API.post('/work/users', payload);
  return response.data;
}

export async function generateWorkUserTemporaryPassword(userId) {
  const response = await API.post(`/work/users/${userId}/temporary-password`);
  return response.data;
}

export async function fetchInvite(token) {
  const response = await API.get(`/invites/${encodeURIComponent(token)}`, {
    skipSuccessToast: true,
  });
  return response.data;
}

export async function acceptInvite(payload) {
  const response = await API.post('/invites/accept', payload);
  return response.data;
}

export async function fetchWorkspaces(params = {}) {
  const response = await API.get('/work/workspaces', { params, skipSuccessToast: true });
  return response.data;
}

export async function fetchWorkspace(workspaceId) {
  const response = await API.get(`/work/workspaces/${workspaceId}`, { skipSuccessToast: true });
  return response.data.workspace;
}

export async function createWorkspace(payload) {
  const response = await API.post('/work/workspaces', payload);
  return response.data.workspace;
}

export async function updateWorkspace(workspaceId, payload) {
  const response = await API.patch(`/work/workspaces/${workspaceId}`, payload);
  return response.data.workspace;
}

export async function addWorkspaceMember(workspaceId, payload) {
  const response = await API.post(`/work/workspaces/${workspaceId}/members`, payload);
  return response.data.member;
}

export async function removeWorkspaceMember(workspaceId, userId) {
  await API.delete(`/work/workspaces/${workspaceId}/members/${userId}`);
}

export async function fetchProjects(params = {}) {
  const response = await API.get('/work/projects', { params, skipSuccessToast: true });
  return response.data;
}

export async function fetchProject(projectId) {
  const response = await API.get(`/work/projects/${projectId}`, { skipSuccessToast: true });
  return response.data.project;
}

export async function createProject(payload) {
  const response = await API.post('/work/projects', payload);
  return response.data.project;
}

export async function updateProject(projectId, payload) {
  const response = await API.patch(`/work/projects/${projectId}`, payload);
  return response.data.project;
}

export async function addProjectMember(projectId, payload) {
  const response = await API.post(`/work/projects/${projectId}/members`, payload);
  return response.data.member;
}

export async function removeProjectMember(projectId, userId) {
  await API.delete(`/work/projects/${projectId}/members/${userId}`);
}

export async function fetchTasks(params = {}) {
  const response = await API.get('/work/tasks', { params, skipSuccessToast: true });
  return response.data;
}

export async function fetchTask(taskId) {
  const response = await API.get(`/work/tasks/${taskId}`, { skipSuccessToast: true });
  return response.data.task;
}

export async function createTask(payload) {
  const response = await API.post('/work/tasks', payload);
  return response.data.task;
}

export async function updateTask(taskId, payload) {
  const response = await API.patch(`/work/tasks/${taskId}`, payload);
  return response.data.task;
}

export async function moveTask(taskId, payload) {
  const response = await API.patch(`/work/tasks/${taskId}/move`, payload, {
    skipSuccessToast: true,
  });
  return response.data.task;
}

export async function fetchTaskBoard(projectId) {
  const response = await API.get('/work/tasks/board', {
    params: { projectId },
    skipSuccessToast: true,
  });
  return response.data;
}

export async function createSubTask(taskId, payload) {
  const response = await API.post(`/work/tasks/${taskId}/subtasks`, payload);
  return response.data.subtask;
}

export async function updateSubTask(taskId, subTaskId, payload) {
  const response = await API.patch(`/work/tasks/${taskId}/subtasks/${subTaskId}`, payload, {
    skipSuccessToast: true,
  });
  return response.data.subtask;
}

export async function deleteSubTask(taskId, subTaskId) {
  await API.delete(`/work/tasks/${taskId}/subtasks/${subTaskId}`);
}

export async function submitTaskForApproval(taskId, note = '') {
  const response = await API.post(`/work/tasks/${taskId}/approvals`, { note });
  return response.data.approvals;
}

export async function fetchTaskApprovals(taskId) {
  const response = await API.get(`/work/tasks/${taskId}/approvals`, {
    skipSuccessToast: true,
  });
  return response.data.approvals;
}

export async function fetchApprovals(params = {}) {
  const response = await API.get('/work/approvals', { params, skipSuccessToast: true });
  return response.data;
}

export async function reviewApproval(approvalId, payload) {
  const response = await API.patch(`/work/approvals/${approvalId}/review`, payload);
  return response.data.approval;
}

export async function fetchTaskComments(taskId) {
  const response = await API.get(`/work/tasks/${taskId}/comments`, {
    params: { limit: 100 },
    skipSuccessToast: true,
  });
  return response.data;
}

export async function createTaskComment(taskId, payload) {
  const response = await API.post(`/work/tasks/${taskId}/comments`, payload);
  return response.data.comment;
}

export async function updateTaskComment(taskId, commentId, payload) {
  const response = await API.patch(`/work/tasks/${taskId}/comments/${commentId}`, payload);
  return response.data.comment;
}

export async function deleteTaskComment(taskId, commentId) {
  await API.delete(`/work/tasks/${taskId}/comments/${commentId}`);
}

export async function fetchTaskAttachments(taskId) {
  const response = await API.get(`/work/tasks/${taskId}/attachments`, {
    skipSuccessToast: true,
  });
  return response.data.attachments;
}

export async function uploadTaskAttachments(taskId, files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await API.post(`/work/tasks/${taskId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.attachments;
}

export async function downloadTaskAttachment(taskId, attachment) {
  const response = await API.get(
    `/work/tasks/${taskId}/attachments/${attachment._id}/download`,
    { responseType: 'blob', skipSuccessToast: true },
  );
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function deleteTaskAttachment(taskId, attachmentId) {
  await API.delete(`/work/tasks/${taskId}/attachments/${attachmentId}`);
}

export async function fetchTaskActivity(taskId) {
  const response = await API.get(`/work/tasks/${taskId}/activity`, {
    params: { limit: 50 },
    skipSuccessToast: true,
  });
  return response.data;
}
