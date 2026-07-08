const express = require('express');
const router = express.Router();
const {
  listConversations,
  getMessages,
  getNotes,
  getFollowUpsForLead,
  listExecutives,
  postMessage,
  postNote,
  updateWhatsAppLead,
  markRead,
} = require('../controllers/whatsappController');
const { protect } = require('../middleware/auth');
const { requireFeature } = require('../middleware/requireFeature');

router.use(protect, requireFeature('whatsapp'));

router.get('/conversations', listConversations);
router.get('/messages/:leadId', getMessages);
router.get('/notes/:leadId', getNotes);
router.get('/followups/:leadId', getFollowUpsForLead);
router.get('/executives', listExecutives);
router.post('/messages', postMessage);
router.post('/notes', postNote);
router.put('/leads/:id', updateWhatsAppLead);
router.put('/read/:leadId', markRead);

module.exports = router;
