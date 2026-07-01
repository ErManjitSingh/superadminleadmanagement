const express = require('express');
const { listAuditLogs, listLoginLogs } = require('../controllers/logsController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);
router.get('/audit', listAuditLogs);
router.get('/login', listLoginLogs);

module.exports = router;
