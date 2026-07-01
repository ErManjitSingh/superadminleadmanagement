const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();

router.use(superAdminProtect);
router.get('/', getDashboard);

module.exports = router;
