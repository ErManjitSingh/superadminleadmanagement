const express = require('express');
const router = express.Router();
const {
  getDashboard,
  listLeads,
  getLeadDetail,
  updateLead,
  addLeadComment,
  listFollowUps,
  listExecutives,
  listQuotations,
  approveQuotation,
  getEscalations,
  escalate,
  getReports,
  listNotifications,
  getProfile,
  getCalendar,
} = require('../controllers/teamLeaderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect, authorize('team_leader'));

router.get('/dashboard', getDashboard);
router.get('/leads', listLeads);
router.get('/leads/:id', getLeadDetail);
router.put('/leads/:id', updateLead);
router.post('/leads/:id/comment', addLeadComment);
router.get('/followups', listFollowUps);
router.get('/executives', listExecutives);
router.get('/quotations/:segment?', listQuotations);
router.put('/quotations/:id', approveQuotation);
router.get('/escalations', getEscalations);
router.post('/escalations', escalate);
router.get('/reports', getReports);
router.get('/notifications', listNotifications);
router.get('/profile', getProfile);
router.get('/calendar', getCalendar);

module.exports = router;
