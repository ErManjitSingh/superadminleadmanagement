const express = require('express');
const router = express.Router();
const {
  getDashboard,
  listLeads,
  getLeadDetail,
  getLeadQuotationsList,
  getLeadNotesList,
  assignLeads,
  listExecutives,
  listFollowUps,
  listQuotations,
  createQuotation,
  updateQuotation,
  listNotifications,
  getReports,
  getCalendar,
} = require('../controllers/salesManagerController');
const {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  listTeamLeaders,
  listAvailableExecutives,
  addMember,
  removeMember,
  transferMember,
  updateTeamLeader,
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect, authorize('sales_manager', 'admin'));

router.get('/dashboard', getDashboard);
router.get('/leads', listLeads);
router.get('/leads/:id/quotations', getLeadQuotationsList);
router.get('/leads/:id/notes-list', getLeadNotesList);
router.get('/leads/:id', getLeadDetail);
router.post('/assign', assignLeads);
router.get('/executives', listExecutives);
router.get('/followups', listFollowUps);
const {
  getQuotationTemplates,
  autosaveQuotation,
  saveQuotationVersion,
  restoreQuotationVersion,
  uploadQuotationPdf,
  getQuotationPdfMeta,
  downloadQuotationPdf,
  previewQuotationPdf,
  regenerateQuotationPdf,
  deleteQuotationPdfHandler,
  sendQuotationWhatsApp,
  sendQuotationEmail,
} = require('../controllers/quotationController');
const { requirePermission } = require('../middleware/requirePermission');
router.get('/quotations/templates', getQuotationTemplates);
router.post('/quotations/autosave', autosaveQuotation);
router.post('/quotations/:id/autosave', autosaveQuotation);
router.post('/quotations/:id/versions', saveQuotationVersion);
router.post('/quotations/:id/versions/:versionNumber/restore', restoreQuotationVersion);
router.get('/quotations/:id/pdf/meta', getQuotationPdfMeta);
router.get('/quotations/:id/pdf/download', downloadQuotationPdf);
router.get('/quotations/:id/pdf/preview', previewQuotationPdf);
router.post('/quotations/:id/pdf/regenerate', regenerateQuotationPdf);
router.delete('/quotations/:id/pdf', deleteQuotationPdfHandler);
router.post('/quotations/:id/pdf', uploadQuotationPdf);
router.post('/quotations/:id/send-whatsapp', requirePermission('whatsapp', 'use'), sendQuotationWhatsApp);
router.post('/quotations/:id/send-email', requirePermission('email', 'send'), sendQuotationEmail);
router.get('/quotations/:segment?', listQuotations);
router.post('/quotations', createQuotation);
router.put('/quotations/:id', updateQuotation);
router.get('/notifications', listNotifications);
router.get('/reports', getReports);
router.get('/calendar', getCalendar);

router.get('/teams/leaders', listTeamLeaders);
router.get('/teams/available-executives', listAvailableExecutives);
router.post('/teams/:id/members', addMember);
router.delete('/teams/:id/members/:memberId', removeMember);
router.put('/teams/:id/transfer', transferMember);
router.put('/teams/:id/leader', updateTeamLeader);
router.route('/teams').get(listTeams).post(createTeam);
router.route('/teams/:id').get(getTeam).put(updateTeam).delete(deleteTeam);

module.exports = router;
