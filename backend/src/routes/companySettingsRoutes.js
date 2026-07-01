const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getCompanySettings, updateCompanySettings } = require('../controllers/companySettingsController');

const router = express.Router();

router.use(protect);
router.get('/', getCompanySettings);
router.patch('/', authorize('admin'), updateCompanySettings);

module.exports = router;
