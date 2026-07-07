const express = require('express');
const {
  listPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
} = require('../controllers/paymentRequestController');
const { superAdminProtect } = require('../middleware/superAdminAuth');

const router = express.Router();

router.use(superAdminProtect);

router.get('/', listPaymentRequests);
router.post('/:id/approve', approvePaymentRequest);
router.post('/:id/reject', rejectPaymentRequest);

module.exports = router;
