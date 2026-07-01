const express = require('express');
const { listSubscriptions } = require('../controllers/subscriptionController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();
router.use(superAdminProtect);
router.get('/', listSubscriptions);

module.exports = router;
