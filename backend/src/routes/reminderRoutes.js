const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');
const { getCounts, list } = require('../controllers/reminderController');

router.use(protect);
router.use(requirePermission('leads', 'view'));

router.get('/counts', getCounts);
router.get('/', list);

module.exports = router;
