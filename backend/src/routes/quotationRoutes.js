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
} = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getQuotationStatsHandler);
router.post('/duplicate/:id', duplicateQuotation);
router.post('/recalculate', recalculateQuotation);
router.route('/').get(listQuotations).post(createQuotation);
router.route('/:id').get(getQuotation).put(updateQuotation).delete(deleteQuotation);

module.exports = router;
