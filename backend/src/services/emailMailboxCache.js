const cacheService = require('./cacheService');

const MAILBOX_LIST_TTL_MS = 20_000;
const MAILBOX_COUNTS_TTL_MS = 30_000;
const MAILBOX_SCOPE_TTL_MS = 45_000;

function mailboxListKey(userId, branchId, { folder, search, page, limit }) {
  const uid = String(userId);
  const branch = branchId || 'all';
  const q = (search || '').trim().toLowerCase();
  return `mailbox:list:${uid}:${branch}:${folder}:${page}:${limit}:${q}`;
}

function mailboxCountsKey(userId, branchId, role) {
  return `mailbox:counts:${String(userId)}:${branchId || 'all'}:${role}`;
}

function mailboxScopeKey(userId, branchId, role) {
  return `mailbox:scope:${role}:${String(userId)}:${branchId || 'all'}`;
}

async function invalidateMailboxCache() {
  await cacheService.invalidate('mailbox:');
  await cacheService.invalidate('email-stats:');
}

module.exports = {
  cacheService,
  MAILBOX_LIST_TTL_MS,
  MAILBOX_COUNTS_TTL_MS,
  MAILBOX_SCOPE_TTL_MS,
  mailboxListKey,
  mailboxCountsKey,
  mailboxScopeKey,
  invalidateMailboxCache,
};
