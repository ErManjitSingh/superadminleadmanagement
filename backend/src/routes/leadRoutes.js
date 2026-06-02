const express = require('express');
const router = express.Router();
const {
  listLeads,
  listLostLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getAssignees,
  assignLeads,
  transferLeadBranch,
  addLeadNote,
  reactivateLead,
  reassignReactivatedLead,
  updateReactivationStage,
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');
const { authorize } = require('../middleware/rbac');
const { validatePaginationQuery } = require('../validators/paginationValidator');

router.use(protect);

router.get('/assignees', getAssignees);
router.get('/lost', listLostLeads);
router.post('/assign', assignLeads);
router.patch('/:id/transfer-branch', authorize('admin'), transferLeadBranch);
router.post('/:id/reactivate', authorize('admin', 'sales_manager'), reactivateLead);
router.post('/:id/reassign-reactivated', authorize('admin', 'sales_manager'), reassignReactivatedLead);
router.patch('/:id/reactivation-stage', authorize('admin', 'sales_manager', 'team_leader'), updateReactivationStage);
router.post('/:id/notes', addLeadNote);
router.get('/', validatePaginationQuery, listLeads);
router.route('/').post(requirePermission('leads', 'create'), createLead);
router.route('/:id').get(getLead).put(requirePermission('leads', 'edit'), updateLead).delete(requirePermission('leads', 'delete'), deleteLead);

module.exports = router;
