const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');
const {
  sendLeadEmail,
  listLeadEmailHistory,
  getEmailStats,
} = require('../controllers/emailController');

router.use(protect);

router.get('/stats', requirePermission('email', 'send'), getEmailStats);
router.get('/leads/:id/history', requirePermission('email', 'send'), listLeadEmailHistory);
router.post('/leads/:id/send', requirePermission('email', 'send'), sendLeadEmail);

module.exports = router;
