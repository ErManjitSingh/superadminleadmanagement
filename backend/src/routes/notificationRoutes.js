const express = require('express');
const router = express.Router();
const {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.route('/').get(listNotifications);
router.put('/:id/read', markNotificationRead);

module.exports = router;
