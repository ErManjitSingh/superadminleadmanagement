const test = require('node:test');
const assert = require('node:assert/strict');
const {
  WORK_PERMISSIONS,
  resolveWorkAccess,
  resolveWorkRole,
} = require('../config/access');
const {
  createWorkUserBody,
  listUsersQuery,
  updateAccessBody,
} = require('../validators/accessSchemas');
const { generateTemporaryPassword } = require('../services/accessService');

test('maps existing CRM roles to safe WorkFlow Hub defaults', () => {
  assert.equal(resolveWorkRole({ role: 'admin' }), 'admin');
  assert.equal(resolveWorkRole({ role: 'sales_manager' }), 'project_manager');
  assert.equal(resolveWorkRole({ role: 'team_leader' }), 'team_leader');
  assert.equal(resolveWorkRole({ role: 'sales_executive' }), 'member');
  assert.equal(resolveWorkRole({ role: 'work_user' }), 'member');
});

test('explicit WorkFlow Hub role overrides the CRM role', () => {
  assert.equal(
    resolveWorkRole({ role: 'admin', workAccess: { role: 'client_viewer' } }),
    'client_viewer',
  );
});

test('disabled access removes every WorkFlow Hub permission', () => {
  const access = resolveWorkAccess({
    role: 'admin',
    workAccess: { enabled: false, role: 'admin' },
  });
  assert.equal(access.enabled, false);
  assert.ok(Object.values(access.permissions).every((allowed) => allowed === false));
});

test('role matrix follows approval and administration boundaries', () => {
  assert.equal(WORK_PERMISSIONS.admin.manageUsers, true);
  assert.equal(WORK_PERMISSIONS.project_manager.approveTasks, true);
  assert.equal(WORK_PERMISSIONS.team_leader.manageUsers, false);
  assert.equal(WORK_PERMISSIONS.member.updateOwnTasks, true);
  assert.equal(WORK_PERMISSIONS.client_viewer.updateOwnTasks, false);
});

test('access update validation rejects unknown fields and invalid roles', () => {
  assert.equal(updateAccessBody.safeParse({ role: 'owner' }).success, false);
  assert.equal(updateAccessBody.safeParse({ unknown: true }).success, false);
  assert.equal(updateAccessBody.safeParse({}).success, false);
  assert.equal(
    updateAccessBody.safeParse({
      role: 'project_manager',
      enabled: true,
      disciplines: ['project_management'],
    }).success,
    true,
  );
});

test('user-list validation clamps unsafe pagination and filters enums', () => {
  assert.equal(listUsersQuery.safeParse({ page: '1', limit: '25' }).success, true);
  assert.equal(listUsersQuery.safeParse({ page: '0', limit: '25' }).success, false);
  assert.equal(listUsersQuery.safeParse({ page: '1', limit: '101' }).success, false);
  assert.equal(listUsersQuery.safeParse({ role: 'super_admin' }).success, false);
});

test('work-user invitations require valid identity and access data', () => {
  assert.equal(createWorkUserBody.safeParse({ name: 'R', email: 'bad' }).success, false);
  assert.equal(
    createWorkUserBody.safeParse({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      role: 'member',
      disciplines: ['seo'],
    }).success,
    true,
  );
});

test('temporary passwords are strong, random, and one-time values', () => {
  const first = generateTemporaryPassword();
  const second = generateTemporaryPassword();
  assert.match(first, /^Wf![A-HJ-NP-Za-km-z2-9]{12}7$/);
  assert.notEqual(first, second);
  assert.ok(first.length >= 16);
});
