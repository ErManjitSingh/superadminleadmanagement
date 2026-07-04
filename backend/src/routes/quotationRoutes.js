const express = require('express');
const router = express.Router();
const {
  listQuotations,
  getQuotationStatsHandler,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  duplicateQuotation,
  recalculateQuotation,
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
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');

router.use(protect);

router.get('/templates', getQuotationTemplates);
router.get('/stats', getQuotationStatsHandler);
router.post('/autosave', autosaveQuotation);
router.post('/duplicate/:id', duplicateQuotation);
router.post('/recalculate', recalculateQuotation);
router.post('/:id/autosave', autosaveQuotation);
router.post('/:id/versions', saveQuotationVersion);
router.post('/:id/versions/:versionNumber/restore', restoreQuotationVersion);

router.get('/:id/pdf/meta', getQuotationPdfMeta);
router.get('/:id/pdf/download', downloadQuotationPdf);
router.get('/:id/pdf/preview', previewQuotationPdf);
router.post('/:id/pdf/regenerate', regenerateQuotationPdf);
router.delete('/:id/pdf', deleteQuotationPdfHandler);
router.post('/:id/pdf', uploadQuotationPdf);
router.post('/:id/send-whatsapp', requirePermission('whatsapp', 'use'), sendQuotationWhatsApp);
router.post('/:id/send-email', requirePermission('email', 'send'), sendQuotationEmail);

router.route('/').get(listQuotations).post(createQuotation);
router.route('/:id').get(getQuotation).put(updateQuotation).delete(deleteQuotation);

module.exports = router;
