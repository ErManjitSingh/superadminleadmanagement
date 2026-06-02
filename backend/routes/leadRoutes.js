const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadAssignees,
  assignLeads,
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/assignees', getLeadAssignees);
router.post('/assign', assignLeads);
router.route('/').get(getLeads).post(createLead);
router.route('/:id').get(getLead).put(updateLead).delete(deleteLead);

module.exports = router;
