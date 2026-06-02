const express = require('express');
const router = express.Router();
const {
  LEAD_FILTER_KEYS,
  getDashboard,
  listLeads,
  getLeadDetail,
  updateLead,
  addLeadNote,
  listFollowUps,
  getFollowUpSummary,
  createFollowUp,
  updateFollowUp,
  listQuotations,
  createQuotation,
  updateQuotation,
  listCustomers,
  listNotifications,
  getProfile,
  getCalendar,
} = require('../controllers/salesExecutiveController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect, authorize('sales_executive'));

router.get('/dashboard', getDashboard);
router.get('/customers', listCustomers);
router.get('/notifications', listNotifications);
router.get('/profile', getProfile);
router.get('/calendar', getCalendar);

router.get('/followups/summary', getFollowUpSummary);
router.get('/followups', listFollowUps);
router.post('/followups', createFollowUp);
router.put('/followups/:id', updateFollowUp);

router.get('/quotations', listQuotations);
router.post('/quotations', createQuotation);
router.put('/quotations/:id', updateQuotation);

router.get('/leads', listLeads);
router.get('/leads/:idOrFilter', (req, res, next) => {
  const seg = req.params.idOrFilter;
  if (LEAD_FILTER_KEYS.includes(seg)) {
    req.query.filter = seg;
    return listLeads(req, res, next);
  }
  req.params.id = seg;
  return getLeadDetail(req, res, next);
});
router.put('/leads/:id', updateLead);
router.post('/leads/:id/notes', addLeadNote);

module.exports = router;
