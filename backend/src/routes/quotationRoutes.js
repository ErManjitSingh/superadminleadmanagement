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
} = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/templates', getQuotationTemplates);
router.get('/stats', getQuotationStatsHandler);
router.post('/autosave', autosaveQuotation);
router.post('/duplicate/:id', duplicateQuotation);
router.post('/recalculate', recalculateQuotation);
router.post('/:id/autosave', autosaveQuotation);
router.post('/:id/versions', saveQuotationVersion);
router.post('/:id/versions/:versionNumber/restore', restoreQuotationVersion);
router.post('/:id/pdf', uploadQuotationPdf);
router.route('/').get(listQuotations).post(createQuotation);
router.route('/:id').get(getQuotation).put(updateQuotation).delete(deleteQuotation);

module.exports = router;
