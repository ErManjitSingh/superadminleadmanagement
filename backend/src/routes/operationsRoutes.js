const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { requirePermission } = require('../middleware/requirePermission');
const { requireFeature } = require('../middleware/requireFeature');
const {
  getDashboard,
  listBookings,
  createBooking,
  generateItineraryPdf,
  getBooking,
  getBookingQuotation,
  syncBookingQuotation,
  updateBooking,
  confirmHotel,
  confirmCab,
  listHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  getTransport,
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  listVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  listVouchers,
  createVoucher,
  updateVoucher,
  listTickets,
  createTicket,
  updateTicket,
  listTasks,
  createTask,
  updateTask,
  listDocuments,
  addDocument,
  getTripTracker,
  getReports,
  getProfile,
  getCalendar,
} = require('../controllers/operationsController');

const {
  getExecutionAnalytics,
  getBookingExecutionHub,
  generateBookingVoucher,
  generateAllBookingVouchers,
  generateTravelKit,
  getVoucher,
  downloadVoucherPdf,
  regenerateVoucherHandler,
  sendVoucherEmailHandler,
  sendVoucherWhatsAppHandler,
  listVouchersEnhanced,
} = require('../controllers/voucherExecutionController');

router.use(protect, requireFeature('bookings'), authorize('operations_manager', 'admin'));

router.get('/dashboard', requirePermission('operations', 'view'), getDashboard);
router.get('/trip-tracker', requirePermission('operations', 'view'), getTripTracker);
router.get('/bookings', requirePermission('operations', 'view'), listBookings);
router.post('/bookings', requirePermission('operations', 'create'), createBooking);
router.get('/bookings/:id', requirePermission('operations', 'view'), getBooking);
router.get('/bookings/:id/quotation', requirePermission('operations', 'view'), getBookingQuotation);
router.post('/bookings/:id/sync-quotation', requirePermission('operations', 'edit'), syncBookingQuotation);
router.put('/bookings/:id', requirePermission('operations', 'edit'), updateBooking);
router.post('/bookings/:id/itinerary-pdf', requirePermission('operations', 'edit'), generateItineraryPdf);
router.post('/bookings/:id/confirm-hotel', requirePermission('operations', 'edit'), confirmHotel);
router.post('/bookings/:id/confirm-cab', requirePermission('operations', 'edit'), confirmCab);
router.get('/bookings/:id/documents', requirePermission('operations', 'view'), listDocuments);
router.post('/bookings/:id/documents', requirePermission('operations', 'edit'), addDocument);

router.get('/hotels', requirePermission('operations', 'view'), listHotels);
router.post('/hotels', requirePermission('operations', 'create'), createHotel);
router.put('/hotels/:id', requirePermission('operations', 'edit'), updateHotel);
router.delete('/hotels/:id', requirePermission('operations', 'delete'), deleteHotel);

router.get('/transport', requirePermission('operations', 'view'), getTransport);

router.get('/activities', requirePermission('operations', 'view'), listActivities);
router.get('/activities/:id', requirePermission('operations', 'view'), getActivity);
router.post('/activities', requirePermission('operations', 'create'), createActivity);
router.put('/activities/:id', requirePermission('operations', 'edit'), updateActivity);
router.delete('/activities/:id', requirePermission('operations', 'delete'), deleteActivity);

router.get('/vendors', requirePermission('operations', 'view'), listVendors);
router.get('/vendors/:id', requirePermission('operations', 'view'), getVendor);
router.post('/vendors', requirePermission('operations', 'create'), createVendor);
router.put('/vendors/:id', requirePermission('operations', 'edit'), updateVendor);
router.delete('/vendors/:id', requirePermission('operations', 'delete'), deleteVendor);

router.get('/vouchers/analytics', requirePermission('operations', 'view'), getExecutionAnalytics);
router.get('/vouchers', requirePermission('operations', 'view'), listVouchersEnhanced);
router.get('/vouchers/:id', requirePermission('operations', 'view'), getVoucher);
router.get('/vouchers/:id/download', requirePermission('operations', 'view'), downloadVoucherPdf);
router.post('/vouchers/:id/regenerate', requirePermission('operations', 'edit'), regenerateVoucherHandler);
router.post('/vouchers/:id/send-email', requirePermission('operations', 'edit'), sendVoucherEmailHandler);
router.post('/vouchers/:id/send-whatsapp', requirePermission('operations', 'edit'), sendVoucherWhatsAppHandler);
router.post('/vouchers', requirePermission('operations', 'create'), createVoucher);
router.put('/vouchers/:id', requirePermission('operations', 'edit'), updateVoucher);

router.get('/bookings/:id/execution', requirePermission('operations', 'view'), getBookingExecutionHub);
router.post('/bookings/:id/vouchers/generate', requirePermission('operations', 'edit'), generateBookingVoucher);
router.post('/bookings/:id/vouchers/generate-all', requirePermission('operations', 'edit'), generateAllBookingVouchers);
router.post('/bookings/:id/travel-kit', requirePermission('operations', 'edit'), generateTravelKit);

router.get('/tasks', requirePermission('operations', 'view'), listTasks);
router.post('/tasks', requirePermission('operations', 'create'), createTask);
router.patch('/tasks/:id', requirePermission('operations', 'edit'), updateTask);

router.get('/tickets', requirePermission('operations', 'view'), listTickets);
router.post('/tickets', requirePermission('operations', 'create'), createTicket);
router.put('/tickets/:id', requirePermission('operations', 'edit'), updateTicket);

router.get('/reports', requirePermission('operations', 'view'), getReports);
router.get('/profile', getProfile);
router.get('/calendar', requirePermission('operations', 'view'), getCalendar);

module.exports = router;
