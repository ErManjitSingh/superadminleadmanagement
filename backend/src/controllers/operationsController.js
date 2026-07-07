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
const { companyScopedIdFilter, assertTenantDocument, tenantFilter } = require('../utils/tenantDocument');
const ops = require('../services/operationsService');
const cacheService = require('../services/cacheService');
const { generateVoucherDocument, generateItineraryDocument } = require('../services/operationsVoucherService');
const {
  enrichBookingWithQuotation,
  syncBookingFromQuotation,
  resolveQuotationForBooking,
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
  let booking = await Booking.findOne(companyScopedIdFilter(req.params.id, req)).lean();
  assertTenantDocument(booking, req, 'Booking');
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

const getBookingQuotation = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne(companyScopedIdFilter(req.params.id, req)).lean();
  assertTenantDocument(booking, req, 'Booking');
  const quotation = await resolveQuotationForBooking(booking);
  if (!quotation) throw new ApiError(404, 'No quotation linked to this booking');
  res.json(quotation);
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await ops.updateBooking(req.params.id, req.body, req.user);
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.json(booking);
});

const confirmHotel = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(booking, req, 'Booking');
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
  const booking = await Booking.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(booking, req, 'Booking');
  booking.cabConfirmation = 'confirmed';
  booking.transport = (booking.transport || []).map((t) => ({ ...t.toObject?.() || t, status: 'confirmed' }));
  await booking.save();
  await cacheService.invalidate('ops:');
  res.json(booking);
});

const listHotels = asyncHandler(async (req, res) => {
  const result = await ops.listHotels(req.query, { branchId: null });
  res.json(result);
});

const createHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.create({ ...req.body, branchId: req.branchId });
  res.status(201).json(hotel);
});

const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findOneAndUpdate(companyScopedIdFilter(req.params.id, req), req.body, { new: true });
  assertTenantDocument(hotel, req, 'Hotel');
  res.json(hotel);
});

const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findOneAndDelete(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(hotel, req, 'Hotel');
  res.json({ message: 'Hotel deleted' });
});

const getTransport = asyncHandler(async (req, res) => {
  const result = await ops.listTransport(req.query, { branchId: null });
  res.json(result);
});

const listActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find().populate('vendor', 'name').sort({ createdAt: -1 }).lean();
  res.json(activities);
});

const getActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOne(companyScopedIdFilter(req.params.id, req)).populate('vendor', 'name').lean();
  assertTenantDocument(activity, req, 'Activity');
  res.json(activity);
});

const createActivity = asyncHandler(async (req, res) => {
  let vendorName = '';
  if (req.body.vendorId) {
    const vendor = await Vendor.findOne(companyScopedIdFilter(req.body.vendorId, req));
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
  const activity = await Activity.findOneAndUpdate(companyScopedIdFilter(req.params.id, req), req.body, { new: true });
  assertTenantDocument(activity, req, 'Activity');
  res.json(activity);
});

const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(activity, req, 'Activity');
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
  const vendor = await Vendor.findOne(companyScopedIdFilter(req.params.id, req)).lean();
  assertTenantDocument(vendor, req, 'Vendor');
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
  const vendor = await Vendor.findOneAndUpdate(companyScopedIdFilter(req.params.id, req), body, { new: true });
  assertTenantDocument(vendor, req, 'Vendor');
  res.json(vendor);
});

const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(vendor, req, 'Vendor');
  await vendor.deleteOne();
  res.json({ message: 'Vendor deleted' });
});

const listVouchers = asyncHandler(async (req, res) => {
  const { listVouchersFiltered } = require('../services/operationsVoucherExecutionService');
  const vouchers = await listVouchersFiltered(req.query);
  res.json(vouchers);
});

const createVoucher = asyncHandler(async (req, res) => {
  const { generateVoucherForAssignment } = require('../services/operationsVoucherExecutionService');
  const bookingId = req.body.bookingId;
  if (!bookingId) throw new ApiError(400, 'Valid booking is required');

  const type = req.body.type === 'cab' ? 'transport' : (req.body.type || 'hotel');
  const assignmentIndex = Number(req.body.assignmentIndex || 0);

  const voucher = await generateVoucherForAssignment(bookingId, {
    type,
    assignmentIndex,
    actor: req.user,
  });

  await cacheService.invalidate('ops:');
  res.status(201).json(voucher);
});

const generateItineraryPdf = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne(companyScopedIdFilter(req.params.id, req)).lean();
  assertTenantDocument(booking, req, 'Booking');
  const pdfUrl = generateItineraryDocument(booking);
  res.json({ pdfUrl });
});

const updateVoucher = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.type === 'cab') body.type = 'transport';
  const voucher = await Voucher.findOneAndUpdate(companyScopedIdFilter(req.params.id, req), body, { new: true });
  assertTenantDocument(voucher, req, 'Voucher');
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
  const ticket = await SupportTicket.findOneAndUpdate(companyScopedIdFilter(req.params.id, req), patch, { new: true });
  assertTenantDocument(ticket, req, 'Support ticket');
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
  const data = await ops.getTripTracker(null);
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
};
