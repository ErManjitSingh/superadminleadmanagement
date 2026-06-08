const express = require('express');
const router = express.Router();
const {
  listLeads,
  listLostLeads,
  getLead,
  createLead,
  seedDemoLeads,
  clearAllLeads,
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
const {
  checkDuplicate,
  getTimeline,
  getAudit,
  listRecycleBin,
  restoreLead,
  permanentDeleteLead,
  getAgingAnalytics,
  listCallNotes,
  addCallNote,
  bulkUpdateStatus,
  bulkExportLeads,
  mergeDuplicateLeads,
  getTransferHistory,
  getSourceAnalyticsHandler,
  getExecutivePerformanceHandler,
  getKpis,
  getSlaAnalytics,
  listAuditLog,
  getKanbanBoardHandler,
} = require('../controllers/enterpriseLeadController');

router.use(protect);

router.get('/check-duplicate', checkDuplicate);
router.get('/kanban-board', getKanbanBoardHandler);
router.get('/recycle-bin', listRecycleBin);
router.get('/analytics/aging', getAgingAnalytics);
router.get('/analytics/sources', getSourceAnalyticsHandler);
router.get('/analytics/executives', getExecutivePerformanceHandler);
router.get('/analytics/kpis', getKpis);
router.get('/analytics/sla', getSlaAnalytics);
router.get('/audit-log', listAuditLog);
router.post('/bulk-status', requirePermission('leads', 'edit'), bulkUpdateStatus);
router.post('/bulk-export', requirePermission('leads', 'view'), bulkExportLeads);
router.post('/merge', authorize('admin', 'sales_manager'), mergeDuplicateLeads);
router.get('/:id/timeline', getTimeline);
router.get('/:id/transfer-history', getTransferHistory);
router.get('/:id/audit', getAudit);
router.get('/:id/call-notes', listCallNotes);
router.post('/:id/call-notes', addCallNote);
router.post('/:id/restore', requirePermission('leads', 'edit'), restoreLead);
router.delete('/:id/permanent', requirePermission('leads', 'delete'), permanentDeleteLead);

router.post('/seed-demo', authorize('admin'), seedDemoLeads);
router.post('/clear-all', authorize('admin'), clearAllLeads);
router.get('/assignees', getAssignees);
router.get('/lost', listLostLeads);
router.post('/assign', authorize('admin', 'sales_manager', 'team_leader'), assignLeads);
router.patch('/:id/transfer-branch', authorize('admin'), transferLeadBranch);
router.post('/:id/reactivate', authorize('admin', 'sales_manager', 'team_leader'), reactivateLead);
router.post('/:id/reassign-reactivated', authorize('admin', 'sales_manager', 'team_leader'), reassignReactivatedLead);
router.patch('/:id/reactivation-stage', authorize('admin', 'sales_manager', 'team_leader'), updateReactivationStage);
router.post('/:id/notes', addLeadNote);
router.get('/', validatePaginationQuery, listLeads);
router.route('/').post(requirePermission('leads', 'create'), createLead);
router.route('/:id').get(getLead).put(requirePermission('leads', 'edit'), updateLead).delete(requirePermission('leads', 'delete'), deleteLead);

module.exports = router;
