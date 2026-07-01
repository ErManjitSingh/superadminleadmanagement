const PlatformNotification = require('../models/PlatformNotification');
const asyncHandler = require('../../utils/asyncHandler');
const { scanAndCreateAlerts } = require('../services/platformNotificationService');

const listNotifications = asyncHandler(async (req, res) => {
  await scanAndCreateAlerts();

  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const unreadOnly = req.query.unread === 'true';

  const filter = unreadOnly ? { read: false } : {};
  const [data, unreadCount] = await Promise.all([
    PlatformNotification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    PlatformNotification.countDocuments({ read: false }),
  ]);

  res.json({ data, unreadCount });
});

const markRead = asyncHandler(async (req, res) => {
  const { ids, all } = req.body;
  if (all) {
    await PlatformNotification.updateMany({ read: false }, { read: true, readAt: new Date() });
  } else if (Array.isArray(ids) && ids.length) {
    await PlatformNotification.updateMany({ _id: { $in: ids } }, { read: true, readAt: new Date() });
  }
  const unreadCount = await PlatformNotification.countDocuments({ read: false });
  res.json({ unreadCount });
});

module.exports = { listNotifications, markRead };
