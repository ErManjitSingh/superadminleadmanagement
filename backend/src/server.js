const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { port, corsOrigins } = require('./config/env');
const { connectDB, getDbStatus } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { ensureIndexes } = require('./config/ensureIndexes');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { applySecurityMiddleware } = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initializeSocket } = require('./socket');
const { NOTIFICATIONS_ENABLED } = require('./config/notifications');
const { startNotificationScheduler } = require('./services/notificationScheduler');
const { purgeOldActivityLogs } = require('./services/activityService');
const { startEmailInboxPoller } = require('./services/emailInboxService');
const { archiveOldTrips } = require('./services/operationsArchiveService');
const superAdminRoutes = require('./superadmin/routes');
const { ensurePlatformIndexes } = require('./superadmin/config/ensurePlatformIndexes');
const { ensureDefaultSettings } = require('./superadmin/services/platformSettingsService');

const app = express();

// Behind Nginx — trust first proxy hop only (required for rate limiting + correct client IP)
app.set('trust proxy', 1);

applySecurityMiddleware(app);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  const db = getDbStatus();
  res.status(200).json({
    status: 'ok',
    service: 'travel-crm-api',
    database: db,
    time: new Date().toISOString(),
  });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Travel CRM API', version: '1.0.0' });
});

app.use('/api', apiLimiter, apiRoutes);
app.use('/api/superadmin', apiLimiter, superAdminRoutes);
app.use(errorHandler);

async function start() {
  await connectDB();
  await connectRedis();
  await ensureIndexes();
  await ensurePlatformIndexes();
  await ensureDefaultSettings();
  await purgeOldActivityLogs();

  const httpServer = http.createServer(app);
  initializeSocket(httpServer);
  if (NOTIFICATIONS_ENABLED) {
    startNotificationScheduler();
  } else {
    console.log('[NotificationScheduler] Disabled (set NOTIFICATIONS_ENABLED=true to enable)');
  }
  startEmailInboxPoller();

  archiveOldTrips().catch(() => {});
  setInterval(() => archiveOldTrips().catch(() => {}), 24 * 60 * 60 * 1000);

  httpServer.listen(port, () => {
    console.log(`[API] Running on http://127.0.0.1:${port}`);
    console.log(`[API] Health: http://127.0.0.1:${port}/api/health`);
  });
}

start().catch((err) => {
  console.error('[API] Failed to start:', err.message);
  process.exit(1);
});

module.exports = app;
