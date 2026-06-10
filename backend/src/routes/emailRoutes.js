const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');
const {
  sendLeadEmail,
  listLeadEmailHistory,
  getEmailStats,
  syncEmailReplies,
  getMailbox,
  getMailboxMessageDetail,
} = require('../controllers/emailController');

router.use(protect);

router.get('/stats', requirePermission('email', 'send'), getEmailStats);
router.get('/mailbox', requirePermission('email', 'send'), getMailbox);
router.get('/messages/:type/:id', requirePermission('email', 'send'), getMailboxMessageDetail);
router.post('/sync-replies', requirePermission('email', 'send'), syncEmailReplies);
router.get('/leads/:id/history', requirePermission('email', 'send'), listLeadEmailHistory);
router.post('/leads/:id/send', requirePermission('email', 'send'), sendLeadEmail);

module.exports = router;
