const express = require('express');
const router = express.Router();
const {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  addRefund,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(listPayments).post(createPayment);
router.post('/:id/refunds', addRefund);
router.route('/:id').get(getPayment).put(updatePayment).delete(deletePayment);

module.exports = router;
