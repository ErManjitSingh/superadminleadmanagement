const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getMyTeam,
  listLeads,
  getLeadDetail,
  getLeadQuotationsList,
  getLeadNotesList,
  updateLead,
  addLeadComment,
  listFollowUps,
  listExecutives,
  listQuotations,
  createQuotation,
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
router.get('/my-team', getMyTeam);
router.get('/leads', listLeads);
router.get('/leads/:id/quotations', getLeadQuotationsList);
router.get('/leads/:id/notes-list', getLeadNotesList);
router.get('/leads/:id', getLeadDetail);
router.put('/leads/:id', updateLead);
router.post('/leads/:id/comment', addLeadComment);
router.get('/followups', listFollowUps);
router.get('/executives', listExecutives);
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
router.put('/quotations/:id', approveQuotation);
router.get('/escalations', getEscalations);
router.post('/escalations', escalate);
router.get('/reports', getReports);
router.get('/notifications', listNotifications);
router.get('/profile', getProfile);
router.get('/calendar', getCalendar);

module.exports = router;
