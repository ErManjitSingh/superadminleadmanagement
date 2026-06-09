const cacheService = require('./cacheService');

const DEFAULT_TTL_MS = 60 * 1000;
const NAV_COUNTS_TTL_MS = 30 * 1000;

function cacheKey(role, scope = 'global') {
  return `${role}:${scope}`;
}

function navCountsKey(role, userId, branchId) {
  return `nav:${role}:${String(userId)}:${branchId || 'all'}`;
}

async function getOrSet(key, factory, ttlMs = DEFAULT_TTL_MS) {
  return cacheService.getOrSet(key, factory, ttlMs);
}

async function invalidate(prefix) {
  return cacheService.invalidate(prefix);
}

function wrapDashboardBuilder(role, builder, ttlMs = DEFAULT_TTL_MS) {
  return async (userId, scope = 'global') => {
    const key = cacheKey(role, scope === 'global' ? userId || scope : scope);
    return getOrSet(key, () => builder(userId), ttlMs);
  };
}

module.exports = {
  getOrSet,
  invalidate,
  wrapDashboardBuilder,
  cacheKey,
  navCountsKey,
  NAV_COUNTS_TTL_MS,
  DEFAULT_TTL_MS,
};
