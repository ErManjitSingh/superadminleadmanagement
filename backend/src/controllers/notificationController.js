const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { formatNotification } = require('../utils/queryHelpers');
const { emitUnreadCount } = require('../services/notificationService');

const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(notifications.map(formatNotification));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ count });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid notification id');
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { read: true },
    { new: true }
  ).lean();

  if (!notification) throw new ApiError(404, 'Notification not found');

  try {
    await emitUnreadCount(req.user._id);
  } catch (err) {
    console.error('[notifications] emit unread failed:', err.message);
  }

  res.json(formatNotification(notification));
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  try {
    await emitUnreadCount(req.user._id);
  } catch (err) {
    console.error('[notifications] emit unread failed:', err.message);
  }
  res.json({ message: 'All notifications marked as read' });
});

module.exports = {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
};
