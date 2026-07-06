const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');
const { authorize } = require('../middleware/rbac');
const {
  getConvertPreview,
  convertLeadWithPayment,
  listPaymentsForBooking,
  addBookingPayment,
  getPaymentReceipt,
  resendPaymentReceipt,
  markBookingFullyPaid,
  getPaymentsDashboard,
  acknowledgeNewBooking,
  getLeadBooking,
  sendPaymentReminderHandler,
} = require('../controllers/bookingPaymentController');

router.use(protect);

router.get('/dashboard', requirePermission('payments', 'view'), getPaymentsDashboard);

router.get('/leads/:id/booking', requirePermission('leads', 'view'), getLeadBooking);
router.get('/leads/:id/convert-preview', requirePermission('leads', 'view'), getConvertPreview);
router.post(
  '/leads/:id/convert-with-payment',
  authorize('sales_executive', 'sales_manager', 'admin', 'team_leader'),
  requirePermission('leads', 'edit'),
  convertLeadWithPayment
);

router.get('/bookings/:bookingId/payments', requirePermission('payments', 'view'), listPaymentsForBooking);
router.post(
  '/bookings/:bookingId/payments',
  authorize('operations_manager', 'admin', 'accountant'),
  addBookingPayment
);
router.get('/bookings/:bookingId/payments/:paymentId/receipt', getPaymentReceipt);
router.post('/bookings/:bookingId/payments/:paymentId/resend', resendPaymentReceipt);
router.post('/bookings/:bookingId/mark-fully-paid', authorize('operations_manager', 'admin'), markBookingFullyPaid);
router.post('/bookings/:bookingId/acknowledge-new', authorize('operations_manager', 'admin'), acknowledgeNewBooking);
router.post('/bookings/:bookingId/send-reminder', authorize('operations_manager', 'admin'), sendPaymentReminderHandler);

module.exports = router;
