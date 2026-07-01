const express = require('express');
const { getReports, getBackups } = require('../controllers/reportsController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);

router.get('/', getReports);
router.get('/backups', getBackups);

module.exports = router;
