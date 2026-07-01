const express = require('express');
const { listNotifications, markRead } = require('../controllers/notificationController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);
router.get('/', listNotifications);
router.post('/read', markRead);

module.exports = router;
