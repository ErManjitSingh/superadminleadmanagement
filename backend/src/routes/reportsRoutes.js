const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect, authorize('admin', 'sales_manager'));

router.get('/analytics', getAnalytics);

module.exports = router;
