const express = require('express');
const { protect } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validateRequest');
const {
  getMyWorkAccess,
  getWorkAccessConfiguration,
  generateTemporaryPassword,
  inviteWorkUser,
  listUsers,
  updateUserAccess,
} = require('../controllers/accessController');
const { attachWorkAccess, requireWorkPermission } = require('../middleware/requireWorkPermission');
const {
  createWorkUserBody,
  listUsersQuery,
  updateAccessBody,
  userIdParams,
} = require('../validators/accessSchemas');
const workspaceController = require('../controllers/workspaceController');
const projectController = require('../controllers/projectController');
const {
  addWorkspaceMemberBody,
  createWorkspaceBody,
  listWorkspacesQuery,
  updateWorkspaceBody,
  updateWorkspaceMemberBody,
  workspaceIdParams,
  workspaceMemberParams,
} = require('../validators/workspaceSchemas');
const {
  addProjectMemberBody,
  createProjectBody,
  listProjectsQuery,
  projectIdParams,
  projectMemberParams,
  updateProjectBody,
  updateProjectMemberBody,
} = require('../validators/projectSchemas');
const taskController = require('../controllers/taskController');
const {
  boardQuery,
  createSubTaskBody,
  createTaskBody,
  listTasksQuery,
  moveTaskBody,
  subTaskParams,
  taskIdParams,
  updateSubTaskBody,
  updateTaskBody,
} = require('../validators/taskSchemas');
const collaborationController = require('../controllers/collaborationController');
const { uploadTaskFiles } = require('../middleware/taskUpload');
const {
  approvalIdParams,
  attachmentParams,
  commentBody,
  commentParams,
  listActivityQuery,
  listApprovalsQuery,
  listCommentsQuery,
  reviewApprovalBody,
  submitApprovalBody,
  updateCommentBody,
} = require('../validators/collaborationSchemas');

const router = express.Router();

router.use(protect);
router.use(attachWorkAccess);

router.get('/access/me', getMyWorkAccess);
router.get('/access/configuration', getWorkAccessConfiguration);
router.get(
  '/users',
  requireWorkPermission('viewUsers'),
  validateRequest({ query: listUsersQuery }),
  listUsers,
);
router.post(
  '/users',
  requireWorkPermission('manageUsers'),
  validateRequest({ body: createWorkUserBody }),
  inviteWorkUser,
);
router.patch(
  '/users/:userId/access',
  requireWorkPermission('manageUsers'),
  validateRequest({ params: userIdParams, body: updateAccessBody }),
  updateUserAccess,
);
router.post(
  '/users/:userId/temporary-password',
  requireWorkPermission('manageUsers'),
  validateRequest({ params: userIdParams }),
  generateTemporaryPassword,
);

router.route('/workspaces')
  .get(
    validateRequest({ query: listWorkspacesQuery }),
    workspaceController.listWorkspaces,
  )
  .post(
    requireWorkPermission('createWorkspaces'),
    validateRequest({ body: createWorkspaceBody }),
    workspaceController.createWorkspace,
  );
router.route('/workspaces/:workspaceId')
  .get(
    validateRequest({ params: workspaceIdParams }),
    workspaceController.getWorkspace,
  )
  .patch(
    validateRequest({ params: workspaceIdParams, body: updateWorkspaceBody }),
    workspaceController.updateWorkspace,
  )
  .delete(
    validateRequest({ params: workspaceIdParams }),
    workspaceController.deleteWorkspace,
  );
router.post(
  '/workspaces/:workspaceId/members',
  validateRequest({ params: workspaceIdParams, body: addWorkspaceMemberBody }),
  workspaceController.addWorkspaceMember,
);
router.patch(
  '/workspaces/:workspaceId/members/:userId',
  validateRequest({ params: workspaceMemberParams, body: updateWorkspaceMemberBody }),
  workspaceController.updateWorkspaceMember,
);
router.delete(
  '/workspaces/:workspaceId/members/:userId',
  validateRequest({ params: workspaceMemberParams }),
  workspaceController.removeWorkspaceMember,
);

router.route('/projects')
  .get(
    validateRequest({ query: listProjectsQuery }),
    projectController.listProjects,
  )
  .post(
    requireWorkPermission('manageProjects'),
    validateRequest({ body: createProjectBody }),
    projectController.createProject,
  );
router.route('/projects/:projectId')
  .get(
    validateRequest({ params: projectIdParams }),
    projectController.getProject,
  )
  .patch(
    validateRequest({ params: projectIdParams, body: updateProjectBody }),
    projectController.updateProject,
  )
  .delete(
    validateRequest({ params: projectIdParams }),
    projectController.deleteProject,
  );
router.post(
  '/projects/:projectId/members',
  validateRequest({ params: projectIdParams, body: addProjectMemberBody }),
  projectController.addProjectMember,
);
router.patch(
  '/projects/:projectId/members/:userId',
  validateRequest({ params: projectMemberParams, body: updateProjectMemberBody }),
  projectController.updateProjectMember,
);
router.delete(
  '/projects/:projectId/members/:userId',
  validateRequest({ params: projectMemberParams }),
  projectController.removeProjectMember,
);

router.get(
  '/tasks/board',
  validateRequest({ query: boardQuery }),
  taskController.getBoard,
);
router.route('/tasks')
  .get(
    validateRequest({ query: listTasksQuery }),
    taskController.listTasks,
  )
  .post(
    validateRequest({ body: createTaskBody }),
    taskController.createTask,
  );
router.route('/tasks/:taskId')
  .get(
    validateRequest({ params: taskIdParams }),
    taskController.getTask,
  )
  .patch(
    validateRequest({ params: taskIdParams, body: updateTaskBody }),
    taskController.updateTask,
  )
  .delete(
    validateRequest({ params: taskIdParams }),
    taskController.deleteTask,
  );
router.patch(
  '/tasks/:taskId/move',
  validateRequest({ params: taskIdParams, body: moveTaskBody }),
  taskController.moveTask,
);
router.post(
  '/tasks/:taskId/subtasks',
  validateRequest({ params: taskIdParams, body: createSubTaskBody }),
  taskController.createSubTask,
);
router.patch(
  '/tasks/:taskId/subtasks/:subTaskId',
  validateRequest({ params: subTaskParams, body: updateSubTaskBody }),
  taskController.updateSubTask,
);
router.delete(
  '/tasks/:taskId/subtasks/:subTaskId',
  validateRequest({ params: subTaskParams }),
  taskController.deleteSubTask,
);

router.get(
  '/approvals',
  validateRequest({ query: listApprovalsQuery }),
  collaborationController.listApprovals,
);
router.patch(
  '/approvals/:approvalId/review',
  validateRequest({ params: approvalIdParams, body: reviewApprovalBody }),
  collaborationController.reviewApproval,
);
router.post(
  '/tasks/:taskId/approvals',
  validateRequest({ params: taskIdParams, body: submitApprovalBody }),
  collaborationController.submitApproval,
);
router.get(
  '/tasks/:taskId/approvals',
  validateRequest({ params: taskIdParams }),
  collaborationController.getApprovalHistory,
);

router.route('/tasks/:taskId/comments')
  .get(
    validateRequest({ params: taskIdParams, query: listCommentsQuery }),
    collaborationController.listComments,
  )
  .post(
    validateRequest({ params: taskIdParams, body: commentBody }),
    collaborationController.createComment,
  );
router.route('/tasks/:taskId/comments/:commentId')
  .patch(
    validateRequest({ params: commentParams, body: updateCommentBody }),
    collaborationController.updateComment,
  )
  .delete(
    validateRequest({ params: commentParams }),
    collaborationController.deleteComment,
  );

router.route('/tasks/:taskId/attachments')
  .get(
    validateRequest({ params: taskIdParams }),
    collaborationController.listAttachments,
  )
  .post(
    validateRequest({ params: taskIdParams }),
    uploadTaskFiles,
    collaborationController.uploadAttachments,
  );
router.get(
  '/tasks/:taskId/attachments/:attachmentId/download',
  validateRequest({ params: attachmentParams }),
  collaborationController.downloadAttachment,
);
router.delete(
  '/tasks/:taskId/attachments/:attachmentId',
  validateRequest({ params: attachmentParams }),
  collaborationController.deleteAttachment,
);
router.get(
  '/tasks/:taskId/activity',
  validateRequest({ params: taskIdParams, query: listActivityQuery }),
  collaborationController.listActivity,
);

module.exports = router;
