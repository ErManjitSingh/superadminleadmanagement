const Redis = require('ioredis');

let client = null;
let ready = false;

function getRedisUrl() {
  return process.env.REDIS_URL || 'redis://127.0.0.1:6379';
}

async function connectRedis() {
  if (client) return client;
  if (process.env.REDIS_DISABLED === 'true') {
    console.warn('[cache] Redis disabled — using in-memory fallback');
    return null;
  }

  try {
    client = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    client.on('error', (err) => {
      ready = false;
      console.warn('[cache] Redis error:', err.message);
    });

    client.on('connect', () => {
      ready = true;
    });

    await client.connect();
    await client.ping();
    ready = true;
    console.log('[cache] Redis connected');
    return client;
  } catch (err) {
    ready = false;
    if (client) {
      client.disconnect();
      client = null;
    }
    console.warn('[cache] Redis unavailable — in-memory fallback:', err.message);
    return null;
  }
}

function getRedisClient() {
  return ready ? client : null;
}

function isRedisReady() {
  return ready && Boolean(client);
}

async function disconnectRedis() {
  if (client) {
    await client.quit().catch(() => client.disconnect());
    client = null;
    ready = false;
  }
}

module.exports = { connectRedis, getRedisClient, isRedisReady, disconnectRedis };
