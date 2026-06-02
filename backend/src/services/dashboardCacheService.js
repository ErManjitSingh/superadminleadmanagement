const cache = new Map();
const DEFAULT_TTL_MS = 60 * 1000;

function cacheKey(role, userId) {
  return `${role}:${userId || 'global'}`;
}

async function getOrSet(key, factory, ttlMs = DEFAULT_TTL_MS) {
  const now = Date.now();
  const hit = cache.get(key);

  if (hit && hit.expiresAt > now) {
    return hit.value;
  }

  const value = await factory();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

function invalidate(prefix) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

function wrapDashboardBuilder(role, builder, ttlMs = DEFAULT_TTL_MS) {
  return async (userId) => {
    const key = cacheKey(role, userId);
    return getOrSet(key, () => builder(userId), ttlMs);
  };
}

module.exports = {
  getOrSet,
  invalidate,
  wrapDashboardBuilder,
  cacheKey,
  DEFAULT_TTL_MS,
};
