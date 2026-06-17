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
const ops = require('../services/operationsService');
const cacheService = require('../services/cacheService');
const { generateVoucherDocument, generateItineraryDocument } = require('../services/operationsVoucherService');
const {
  enrichBookingWithQuotation,
  syncBookingFromQuotation,
} = require('../services/operationsQuotationSyncService');

const getDashboard = asyncHandler(async (req, res) => {
  // Command center shows org-wide metrics across all branches.
  const data = await ops.getDashboard(null);
  res.json(data);
});

const listBookings = asyncHandler(async (req, res) => {
  const result = await ops.listBookings(req.query, { branchId: req.branchId });
  res.json(result);
});

const createBooking = asyncHandler(async (req, res) => {
  const booking = await ops.createBooking({ ...req.body, branchId: req.branchId || req.body.branchId }, req.user);
  res.status(201).json(booking);
});

const getBooking = asyncHandler(async (req, res) => {
  let booking = await Booking.findById(req.params.id).lean();
  if (!booking) throw new ApiError(404, 'Booking not found');
  booking = await enrichBookingWithQuotation(booking);
  const [tasks, documents] = await Promise.all([
    ops.listTasks({ bookingId: req.params.id }),
    ops.listDocuments(req.params.id),
  ]);
  res.json({ ...booking, tasks, documents });
});

const syncBookingQuotation = asyncHandler(async (req, res) => {
  const result = await syncBookingFromQuotation(req.params.id, { force: req.body?.force === true });
  if (!result?.booking) throw new ApiError(404, 'Booking not found');
  if (!result.quotation) throw new ApiError(404, 'No quotation linked to this booking');
  await cacheService.invalidate('ops:');
  const [tasks, documents] = await Promise.all([
    ops.listTasks({ bookingId: req.params.id }),
    ops.listDocuments(req.params.id),
  ]);
  res.json({
    ...result.booking,
    tasks,
    documents,
    quotationPreview: result.quotationPreview,
    quotationMeta: result.quotationPreview?.meta,
    syncedFromQuotation: result.synced,
  });
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await ops.updateBooking(req.params.id, req.body, req.user);
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.json(booking);
});

const confirmHotel = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  booking.hotelConfirmation = 'confirmed';
  booking.hotels = (booking.hotels || []).map((h) => ({ ...h.toObject?.() || h, status: 'confirmed' }));
  if (['booking_received', 'pending_verification', 'pending'].includes(booking.status)) {
    booking.status = 'confirmed';
  }
  await booking.save();
  await cacheService.invalidate('ops:');
  res.json(booking);
});

const confirmCab = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  booking.cabConfirmation = 'confirmed';
  booking.transport = (booking.transport || []).map((t) => ({ ...t.toObject?.() || t, status: 'confirmed' }));
  await booking.save();
  await cacheService.invalidate('ops:');
  res.json(booking);
});

const listHotels = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }
  if (req.query.destination) filter.destination = new RegExp(req.query.destination, 'i');
  const hotels = await Hotel.find(filter).sort({ name: 1 }).lean();
  res.json(hotels);
});

const createHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.create({ ...req.body, branchId: req.branchId });
  res.status(201).json(hotel);
});

const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!hotel) throw new ApiError(404, 'Hotel not found');
  res.json(hotel);
});

const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndDelete(req.params.id);
  if (!hotel) throw new ApiError(404, 'Hotel not found');
  res.json({ message: 'Hotel deleted' });
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
  if (req.query.type) filter.type = req.query.type === 'cab' ? 'transport' : req.query.type;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { destination: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const vendors = await Vendor.find(filter).sort({ name: 1 }).lean();
  res.json(vendors);
});

const getVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id).lean();
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  res.json(vendor);
});

const createVendor = asyncHandler(async (req, res) => {
  const body = { ...req.body, branchId: req.branchId };
  if (body.type === 'cab') body.type = 'transport';
  const vendor = await Vendor.create({ status: 'active', rating: 4.0, ...body });
  res.status(201).json(vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.type === 'cab') body.type = 'transport';
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, body, { new: true });
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
  const vouchers = await Voucher.find()
    .populate('booking', 'bookingNumber customerName destination')
    .sort({ createdAt: -1 })
    .lean();
  res.json(vouchers);
});

const createVoucher = asyncHandler(async (req, res) => {
  const booking = req.body.bookingId ? await Booking.findById(req.body.bookingId).lean() : null;
  if (!booking) throw new ApiError(400, 'Valid booking is required');

  const type = req.body.type === 'cab' ? 'transport' : req.body.type;
  const count = await Voucher.countDocuments();
  const voucherNumber = `VCH-${(type?.[0] || 'M').toUpperCase()}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const details = {
    title: req.body.title || `${booking.destination} ${type} voucher`,
    validFrom: req.body.validFrom || booking.travelDate,
    validUntil: req.body.validUntil || booking.returnDate,
  };

  const voucherDoc = {
    type,
    booking: booking._id,
    voucherNumber,
    bookingNumber: booking.bookingNumber,
    customerName: booking.customerName,
    branchId: booking.branchId || req.branchId,
    status: 'issued',
    issuedAt: new Date(),
    issuedBy: req.user._id,
    details,
  };

  const pdfUrl = generateVoucherDocument(voucherDoc, booking);
  voucherDoc.pdfUrl = pdfUrl;

  const voucher = await Voucher.create(voucherDoc);

  if (type === 'master' || req.body.type === 'master') {
    await Booking.findByIdAndUpdate(booking._id, { voucherStatus: 'issued' });
  }

  await cacheService.invalidate('ops:');
  res.status(201).json(voucher);
});

const generateItineraryPdf = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).lean();
  if (!booking) throw new ApiError(404, 'Booking not found');
  const pdfUrl = generateItineraryDocument(booking);
  res.json({ pdfUrl });
});

const updateVoucher = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.type === 'cab') body.type = 'transport';
  const voucher = await Voucher.findByIdAndUpdate(req.params.id, body, { new: true });
  if (!voucher) throw new ApiError(404, 'Voucher not found');
  res.json(voucher);
});

const listTickets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 }).lean();
  res.json(tickets);
});

const createTicket = asyncHandler(async (req, res) => {
  const count = await SupportTicket.countDocuments();
  const ticket = await SupportTicket.create({
    ...req.body,
    branchId: req.branchId,
    ticketNumber: `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
    lastUpdate: new Date(),
  });
  res.status(201).json(ticket);
});

const updateTicket = asyncHandler(async (req, res) => {
  const patch = { ...req.body, lastUpdate: new Date() };
  if (req.body.status === 'resolved' || req.body.status === 'closed') {
    patch.resolvedAt = new Date();
  }
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  res.json(ticket);
});

const listTasks = asyncHandler(async (req, res) => {
  const tasks = await ops.listTasks(req.query, { branchId: req.branchId });
  res.json(tasks);
});

const createTask = asyncHandler(async (req, res) => {
  const task = await ops.createTask({ ...req.body, branchId: req.branchId }, req.user);
  res.status(201).json(task);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await ops.updateTask(req.params.id, req.body);
  if (!task) throw new ApiError(404, 'Task not found');
  res.json(task);
});

const listDocuments = asyncHandler(async (req, res) => {
  const docs = await ops.listDocuments(req.params.id);
  res.json(docs);
});

const addDocument = asyncHandler(async (req, res) => {
  const doc = await ops.addDocument(req.params.id, req.body, req.user);
  res.status(201).json(doc);
});

const getTripTracker = asyncHandler(async (req, res) => {
  const data = await ops.getTripTracker(req.branchId);
  res.json(data);
});

const getReports = asyncHandler(async (req, res) => {
  const data = await ops.buildReports(req.branchId);
  res.json(data);
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
  const bookings = await Booking.find({ travelDate: { $exists: true }, archivedAt: { $exists: false } }).lean();
  const events = bookings.map((b) => ({
    _id: b._id,
    title: `${b.customerName} — ${b.destination}`,
    start: b.travelDate,
    end: b.returnDate || b.travelDate,
    type: 'travel',
    status: b.status,
  }));
  res.json(events);
});

module.exports = {
  getDashboard,
  listBookings,
  createBooking,
  generateItineraryPdf,
  getBooking,
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
};
