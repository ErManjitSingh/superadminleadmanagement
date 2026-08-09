const test = require('node:test');
const assert = require('node:assert/strict');
const { createWorkspaceBody, updateWorkspaceBody } = require('../validators/workspaceSchemas');
const { createProjectBody, updateProjectBody } = require('../validators/projectSchemas');
const {
  createSubTaskBody,
  createTaskBody,
  listTasksQuery,
  moveTaskBody,
  updateTaskBody,
} = require('../validators/taskSchemas');
const { projectHealth } = require('../services/projectService');
const {
  commentBody,
  listApprovalsQuery,
  reviewApprovalBody,
  submitApprovalBody,
} = require('../validators/collaborationSchemas');
const { assertFileSignature } = require('../services/collaborationService');

const id = '64b7f142c9a4e3d29c123456';

test('workspace creation accepts bounded business fields and rejects unknown input', () => {
  const valid = createWorkspaceBody.safeParse({
    name: 'India Holiday Destinations',
    description: 'Delivery workspace',
    color: '#177245',
    memberIds: [id],
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.icon, 'briefcase');

  assert.equal(createWorkspaceBody.safeParse({ name: 'IT', injected: true }).success, false);
  assert.equal(updateWorkspaceBody.safeParse({}).success, false);
});

test('project creation validates dates, enums, and tenant resource identifiers', () => {
  const valid = createProjectBody.safeParse({
    name: 'Website redesign',
    workspaceId: id,
    managerId: id,
    startDate: '2026-08-10T00:00:00.000Z',
    dueDate: '2026-09-10T00:00:00.000Z',
    priority: 'high',
    tags: ['Design', 'Website'],
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.status, 'planning');

  const invalidDates = createProjectBody.safeParse({
    name: 'Website redesign',
    workspaceId: id,
    managerId: id,
    startDate: '2026-09-10T00:00:00.000Z',
    dueDate: '2026-08-10T00:00:00.000Z',
  });
  assert.equal(invalidDates.success, false);
  assert.equal(updateProjectBody.safeParse({ priority: 'critical' }).success, false);
});

test('project health surfaces completed, blocked, overdue, and approaching projects', () => {
  assert.equal(projectHealth({ status: 'completed', progress: 100 }), 'healthy');
  assert.equal(projectHealth({ status: 'on_hold', progress: 20 }), 'at_risk');
  assert.equal(projectHealth({
    status: 'in_progress',
    progress: 50,
    dueDate: new Date(Date.now() - 86400000),
  }), 'delayed');
  assert.equal(projectHealth({
    status: 'in_progress',
    progress: 50,
    dueDate: new Date(Date.now() + (3 * 86400000)),
  }), 'at_risk');
});

test('task creation validates project scope, work fields, and date order', () => {
  const valid = createTaskBody.safeParse({
    projectId: id,
    title: 'Build responsive package page',
    type: 'feature',
    assigneeIds: [id],
    priority: 'high',
    status: 'todo',
    startDate: '2026-08-10T00:00:00.000Z',
    dueDate: '2026-08-15T23:59:59.000Z',
    estimatedHours: 12,
    paymentAmount: 5000,
    tags: ['development', 'website'],
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.description, '');
  assert.equal(valid.data.paymentAmount, 5000);

  assert.equal(createTaskBody.safeParse({
    projectId: id,
    title: 'Invalid dates',
    startDate: '2026-08-20T00:00:00.000Z',
    dueDate: '2026-08-10T00:00:00.000Z',
  }).success, false);
  assert.equal(updateTaskBody.safeParse({ approvalStatus: 'approved' }).success, false);
  assert.equal(updateTaskBody.safeParse({ paymentAmount: -1 }).success, false);
});

test('task board movement and subtask validation reject unsafe input', () => {
  assert.equal(moveTaskBody.safeParse({ status: 'in_progress', order: 2000 }).success, true);
  assert.equal(moveTaskBody.safeParse({ status: 'deleted' }).success, false);
  assert.equal(createSubTaskBody.safeParse({ title: 'Test tablet layout' }).success, true);
  assert.equal(createSubTaskBody.safeParse({ title: '', injected: true }).success, false);
  assert.equal(listTasksQuery.safeParse({ mine: 'true', limit: '500' }).success, false);
});

test('approval validation requires a rejection reason and bounded queue filters', () => {
  assert.equal(submitApprovalBody.safeParse({ note: 'Ready for review' }).success, true);
  assert.equal(reviewApprovalBody.safeParse({ decision: 'approved', note: '' }).success, true);
  assert.equal(reviewApprovalBody.safeParse({ decision: 'rejected', note: '' }).success, false);
  assert.equal(reviewApprovalBody.safeParse({ decision: 'rejected', note: 'Fix responsive spacing' }).success, true);
  assert.equal(listApprovalsQuery.safeParse({ status: 'pending', limit: '101' }).success, false);
});

test('comment validation supports replies and explicit mention identifiers', () => {
  assert.equal(commentBody.safeParse({
    body: 'Please review this update.',
    parentCommentId: id,
    mentionIds: [id],
  }).success, true);
  assert.equal(commentBody.safeParse({ body: '', mentionIds: [] }).success, false);
  assert.equal(commentBody.safeParse({ body: 'Unsafe', mentionIds: [], html: '<script>' }).success, false);
});

test('attachment signature validation rejects disguised executable content', () => {
  assert.doesNotThrow(() => assertFileSignature({
    originalname: 'review.pdf',
    buffer: Buffer.from('%PDF-1.7\nsafe fixture'),
  }));
  assert.throws(() => assertFileSignature({
    originalname: 'malware.pdf',
    buffer: Buffer.from('MZ executable content'),
  }), /does not match its file type/);
});
