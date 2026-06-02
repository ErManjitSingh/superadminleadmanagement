const express = require('express');
const router = express.Router();
const {
  getDashboard,
  listBookings,
  getBooking,
  updateBooking,
  confirmHotel,
  confirmCab,
  listHotels,
  createHotel,
  updateHotel,
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
  updateTicket,
  getReports,
  getProfile,
  getCalendar,
} = require('../controllers/operationsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/bookings', listBookings);
router.get('/bookings/:id', getBooking);
router.put('/bookings/:id', updateBooking);
router.post('/bookings/:id/confirm-hotel', confirmHotel);
router.post('/bookings/:id/confirm-cab', confirmCab);
router.get('/hotels', listHotels);
router.post('/hotels', createHotel);
router.put('/hotels/:id', updateHotel);
router.get('/transport', getTransport);
router.get('/activities', listActivities);
router.get('/activities/:id', getActivity);
router.post('/activities', createActivity);
router.put('/activities/:id', updateActivity);
router.delete('/activities/:id', deleteActivity);
router.get('/vendors', listVendors);
router.get('/vendors/:id', getVendor);
router.post('/vendors', createVendor);
router.put('/vendors/:id', updateVendor);
router.delete('/vendors/:id', deleteVendor);
router.get('/vouchers', listVouchers);
router.post('/vouchers', createVoucher);
router.put('/vouchers/:id', updateVoucher);
router.get('/tickets', listTickets);
router.put('/tickets/:id', updateTicket);
router.get('/reports', getReports);
router.get('/profile', getProfile);
router.get('/calendar', getCalendar);

module.exports = router;
