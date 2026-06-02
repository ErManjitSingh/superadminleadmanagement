const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const Activity = require('../models/Activity');
const Voucher = require('../models/Voucher');
const SupportTicket = require('../models/SupportTicket');
const Hotel = require('../models/Hotel');
const Cab = require('../models/Cab');
const Flight = require('../models/Flight');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { notifyBookingConfirmed } = require('../services/notificationService');

const getDashboard = asyncHandler(async (req, res) => {
  const [bookings, openTickets, pendingBookings, confirmedBookings] = await Promise.all([
    Booking.countDocuments(),
    SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'confirmed' }),
  ]);

  res.json({
    kpis: {
      totalBookings: bookings,
      openTickets,
      pendingBookings,
      confirmedBookings,
    },
    recentBookings: await Booking.find().sort({ createdAt: -1 }).limit(5).lean(),
  });
});

const listBookings = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { bookingNumber: { $regex: search, $options: 'i' } },
      { destination: { $regex: search, $options: 'i' } },
    ];
  }

  const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean();
  res.json(bookings);
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).lean();
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.json(booking);
});

const updateBooking = asyncHandler(async (req, res) => {
  const prev = await Booking.findById(req.params.id).lean();
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (prev?.status !== 'confirmed' && booking.status === 'confirmed') {
    notifyBookingConfirmed(booking.toObject ? booking.toObject() : booking).catch(() => {});
  }
  res.json(booking);
});

const confirmHotel = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  booking.hotelConfirmation = 'confirmed';
  booking.hotels = (booking.hotels || []).map((h) => ({ ...h, status: 'confirmed' }));
  const wasPending = booking.status === 'pending';
  if (booking.status === 'pending') booking.status = 'confirmed';
  await booking.save();
  if (wasPending) {
    notifyBookingConfirmed(booking.toObject ? booking.toObject() : booking).catch(() => {});
  }
  res.json(booking);
});

const confirmCab = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  booking.cabConfirmation = 'confirmed';
  booking.transport = (booking.transport || []).map((t) => ({ ...t, status: 'confirmed' }));
  await booking.save();
  res.json(booking);
});

const listHotels = asyncHandler(async (req, res) => {
  const hotels = await Hotel.find().sort({ createdAt: -1 }).lean();
  res.json(hotels);
});

const createHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.create(req.body);
  res.status(201).json(hotel);
});

const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!hotel) throw new ApiError(404, 'Hotel not found');
  res.json(hotel);
});

const getTransport = asyncHandler(async (req, res) => {
  const [cabs, flights] = await Promise.all([
    Cab.find().sort({ createdAt: -1 }).lean(),
    Flight.find().sort({ createdAt: -1 }).lean(),
  ]);
  res.json({ cabs, flights });
});

const listActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find().populate('vendor', 'name').sort({ createdAt: -1 }).lean();
  res.json(activities);
});

const getActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id).populate('vendor', 'name').lean();
  if (!activity) throw new ApiError(404, 'Activity not found');
  res.json(activity);
});

const createActivity = asyncHandler(async (req, res) => {
  let vendorName = '';
  if (req.body.vendorId) {
    const vendor = await Vendor.findById(req.body.vendorId);
    vendorName = vendor?.name || '';
  }
  const activity = await Activity.create({
    ...req.body,
    vendor: req.body.vendorId,
    vendorName,
    status: 'active',
  });
  res.status(201).json(activity);
});

const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!activity) throw new ApiError(404, 'Activity not found');
  res.json(activity);
});

const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) throw new ApiError(404, 'Activity not found');
  await activity.deleteOne();
  res.json({ message: 'Activity deleted' });
});

const listVendors = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  const vendors = await Vendor.find(filter).sort({ name: 1 }).lean();
  res.json(vendors);
});

const getVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id).lean();
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  res.json(vendor);
});

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create({ status: 'active', rating: 4.0, ...req.body });
  res.status(201).json(vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  res.json(vendor);
});

const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  await vendor.deleteOne();
  res.json({ message: 'Vendor deleted' });
});

const listVouchers = asyncHandler(async (req, res) => {
  const vouchers = await Voucher.find().populate('booking', 'bookingNumber customerName').sort({ createdAt: -1 }).lean();
  res.json(vouchers);
});

const createVoucher = asyncHandler(async (req, res) => {
  const booking = req.body.bookingId ? await Booking.findById(req.body.bookingId) : null;
  const count = await Voucher.countDocuments();
  const voucher = await Voucher.create({
    ...req.body,
    booking: req.body.bookingId,
    voucherNumber: `VCH-${(req.body.type?.[0] || 'X').toUpperCase()}-2026-${String(count + 91).padStart(4, '0')}`,
    bookingNumber: booking?.bookingNumber,
    customerName: booking?.customerName,
    status: 'draft',
  });
  res.status(201).json(voucher);
});

const updateVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!voucher) throw new ApiError(404, 'Voucher not found');
  res.json(voucher);
});

const listTickets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 }).lean();
  res.json(tickets);
});

const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { ...req.body, lastUpdate: new Date() },
    { new: true }
  );
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  res.json(ticket);
});

const getReports = asyncHandler(async (req, res) => {
  const [bookings, vendors] = await Promise.all([
    Booking.countDocuments(),
    Vendor.countDocuments({ status: 'active' }),
  ]);
  res.json({ bookings, vendors, revenue: 0 });
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    user: {
      name: req.user.name,
      email: req.user.email,
      roleName: 'Operations Manager',
      department: req.user.department || 'Operations',
    },
    stats: { bookingsManaged: await Booking.countDocuments() },
  });
});

const getCalendar = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ travelDate: { $exists: true } }).lean();
  const events = bookings.map((b) => ({
    _id: b._id,
    title: `${b.customerName} — ${b.destination}`,
    start: b.travelDate,
    type: 'travel',
  }));
  res.json(events);
});

module.exports = {
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
};
