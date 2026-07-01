const express = require('express');
const { getSettings, patchSettings } = require('../controllers/settingsController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);
router.get('/', getSettings);
router.patch('/', patchSettings);

module.exports = router;
