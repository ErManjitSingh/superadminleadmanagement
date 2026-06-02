const express = require('express');
const router = express.Router();
const { listActivityLogs, createActivityLog } = require('../controllers/activityLogController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(listActivityLogs).post(createActivityLog);

module.exports = router;
