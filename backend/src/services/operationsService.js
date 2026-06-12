const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const Activity = require('../models/Activity');
const Voucher = require('../models/Voucher');
const SupportTicket = require('../models/SupportTicket');
const Hotel = require('../models/Hotel');
const Cab = require('../models/Cab');
const Flight = require('../models/Flight');
const TripTask = require('../models/TripTask');
const TripDocument = require('../models/TripDocument');
const Payment = require('../models/Payment');
const Quotation = require('../models/Quotation');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { withBranch } = require('../utils/branchScope');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { createOperationsTasksForBooking } = require('./operationsAutomationService');
const { notifyBookingConfirmed } = require('./notificationService');
const cacheService = require('./cacheService');

const OPS_DASHBOARD_TTL = 30_000;

const STATUS_ROUTE_MAP = {
  pending: ['booking_received', 'pending_verification', 'pending'],
  confirmed: ['confirmed'],
  active: ['in_progress'],
  completed: ['completed'],
  cancelled: ['cancelled'],
  refund: ['refund_pending', 'refund_completed'],
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function resolveStatusFilter(statusKey) {
  if (!statusKey) return null;
  return STATUS_ROUTE_MAP[statusKey] || [statusKey];
}

function notArchivedFilter() {
  return { archivedAt: { $exists: false } };
}

async function nextBookingNumber() {
  const year = new Date().getFullYear();
  const count = await Booking.countDocuments({
    bookingNumber: new RegExp(`^BK-${year}-`),
  });
  return `BK-${year}-${String(count + 1).padStart(4, '0')}`;
}

async function buildDashboard(branchId) {
  const base = withBranch(notArchivedFilter(), branchId);
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const tomorrowEnd = endOfDay(new Date(Date.now() + 86400000));

  const pendingHotel = {
    ...base,
    $or: [{ hotelConfirmation: 'pending' }, { 'hotels.status': { $in: ['pending', 'requested'] } }],
  };
  const pendingCab = {
    ...base,
    $or: [{ cabConfirmation: 'pending' }, { 'transport.status': { $in: ['pending', 'requested'] } }],
  };
  const pendingActivity = {
    ...base,
    'activities.status': { $in: ['pending'] },
  };
  const pendingVoucher = { ...base, voucherStatus: 'pending' };

  const [
    todaysArrivals,
    todaysDepartures,
    upcomingTours,
    pendingBookings,
    hotelPending,
    cabPending,
    activityPending,
    voucherPending,
    activeTrips,
    completedTrips,
    openTickets,
    totalBookings,
    branchStats,
    recentBookings,
    pendingTasks,
    pendingConfirmations,
    openTicketsList,
  ] = await Promise.all([
    Booking.countDocuments({ ...base, travelDate: { $gte: todayStart, $lte: todayEnd } }),
    Booking.countDocuments({ ...base, returnDate: { $gte: todayStart, $lte: todayEnd } }),
    Booking.countDocuments({
      ...base,
      travelDate: { $gt: todayEnd },
      status: { $in: ['confirmed', 'in_progress', 'booking_received', 'pending_verification'] },
    }),
    Booking.countDocuments({
      ...base,
      status: { $in: STATUS_ROUTE_MAP.pending },
    }),
    Booking.countDocuments(pendingHotel),
    Booking.countDocuments(pendingCab),
    Booking.countDocuments(pendingActivity),
    Booking.countDocuments(pendingVoucher),
    Booking.countDocuments({ ...base, status: 'in_progress' }),
    Booking.countDocuments({ ...base, status: 'completed' }),
    SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Booking.countDocuments(base),
    Booking.aggregate([
      { $match: base },
      { $group: { _id: '$branchId', count: { $sum: 1 } } },
    ]),
    Booking.find(base).sort({ createdAt: -1 }).limit(8).select(
      'bookingNumber customerName destination travelDate returnDate status totalAmount hotelConfirmation cabConfirmation'
    ).lean(),
    TripTask.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
    Booking.find({
      ...base,
      status: { $in: STATUS_ROUTE_MAP.pending },
      $or: [{ hotelConfirmation: 'pending' }, { cabConfirmation: 'pending' }],
    })
      .sort({ travelDate: 1 })
      .limit(8)
      .select('bookingNumber customerName destination hotelConfirmation cabConfirmation travelDate')
      .lean(),
    SupportTicket.find({ status: { $in: ['open', 'in_progress'] } })
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
  ]);

  const tripsStartingTomorrow = await Booking.countDocuments({
    ...base,
    travelDate: { $gt: todayEnd, $lte: tomorrowEnd },
    status: { $in: ['confirmed', 'in_progress', 'booking_received'] },
  });

  return {
    kpis: {
      todaysArrivals,
      todaysDepartures,
      upcomingTours,
      pendingBookings,
      hotelPending,
      cabPending,
      activityPending,
      voucherPending,
      hotelConfirmations: hotelPending,
      cabConfirmations: cabPending,
      activeTrips,
      completedTrips,
      totalActiveTrips: activeTrips,
      openTickets,
      totalBookings,
      pendingConfirmations: hotelPending + cabPending,
      pendingTasks,
      tripsStartingTomorrow,
    },
    branchStats,
    recentBookings,
    pendingConfirmations,
    openTickets: openTicketsList,
    upcomingTrips: await Booking.find({
      ...base,
      travelDate: { $gte: todayStart },
      status: { $nin: ['cancelled', 'completed', 'refund_completed'] },
    })
      .sort({ travelDate: 1 })
      .limit(10)
      .select('bookingNumber customerName destination travelDate returnDate status')
      .lean(),
  };
}

async function getDashboard(branchId) {
  const key = `ops:dashboard:${branchId || 'all'}`;
  return cacheService.getOrSet(key, () => buildDashboard(branchId), OPS_DASHBOARD_TTL);
}

async function listBookings(query = {}, { branchId } = {}) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = withBranch(notArchivedFilter(), branchId);

  const statusList = resolveStatusFilter(query.status);
  if (statusList) filter.status = { $in: statusList };

  if (query.search?.trim()) {
    const q = query.search.trim();
    filter.$or = [
      { customerName: { $regex: q, $options: 'i' } },
      { bookingNumber: { $regex: q, $options: 'i' } },
      { destination: { $regex: q, $options: 'i' } },
      { customerPhone: { $regex: q, $options: 'i' } },
    ];
  }

  const [rows, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);

  return paginatedResponse(rows, { page, limit, total });
}

async function createBooking(payload, actor) {
  const bookingNumber = await nextBookingNumber();
  const pendingAmount = Math.max(0, Number(payload.totalAmount || 0) - Number(payload.advanceReceived || 0));

  const booking = await Booking.create({
    ...payload,
    bookingNumber,
    status: payload.status || 'booking_received',
    pendingAmount,
    assignedTo: payload.assignedTo || actor?._id,
    createdBy: actor?._id,
  });

  if (booking.status === 'confirmed') {
    await createOperationsTasksForBooking(booking, actor);
    notifyBookingConfirmed(booking.toObject()).catch(() => {});
  }

  await cacheService.invalidate('ops:');
  return booking;
}

async function updateBooking(id, payload, actor) {
  const prev = await Booking.findById(id).lean();
  if (!prev) return null;

  if (payload.totalAmount != null || payload.advanceReceived != null) {
    const total = Number(payload.totalAmount ?? prev.totalAmount ?? 0);
    const advance = Number(payload.advanceReceived ?? prev.advanceReceived ?? 0);
    payload.pendingAmount = Math.max(0, total - advance);
  }

  const booking = await Booking.findByIdAndUpdate(id, payload, { new: true });
  if (!booking) return null;

  const wasNotConfirmed = !['confirmed', 'in_progress'].includes(prev.status);
  if (wasNotConfirmed && booking.status === 'confirmed') {
    await createOperationsTasksForBooking(booking, actor);
    notifyBookingConfirmed(booking.toObject()).catch(() => {});
  }

  await cacheService.invalidate('ops:');
  return booking;
}

function mapQuoteHotels(selected = []) {
  return selected.map((h) => ({
    hotelName: h.name || h.hotelName || '',
    destination: h.destination || h.location || '',
    roomType: h.roomType || '',
    checkIn: h.checkIn,
    checkOut: h.checkOut,
    status: 'pending',
  }));
}

function mapQuoteTransport(selected = []) {
  return selected.map((t) => ({
    vehicleType: t.vehicleType || t.type || 'suv',
    pickupLocation: t.pickup || t.pickupLocation || '',
    dropLocation: t.drop || t.dropLocation || '',
    status: 'pending',
  }));
}

function mapQuoteActivities(selected = []) {
  return selected.map((a) => ({
    name: a.name || a.title || '',
    scheduledAt: a.date || a.scheduledAt,
    status: 'pending',
  }));
}

async function buildBookingPayloadFromPayment(payment) {
  const [quotation, lead] = await Promise.all([
    payment.quotation ? Quotation.findById(payment.quotation).lean() : null,
    payment.lead ? Lead.findById(payment.lead).lean() : null,
  ]);

  let executive = null;
  if (quotation?.createdByExecutive) {
    executive = await User.findById(quotation.createdByExecutive).select('name').lean();
  }

  const snap = quotation?.packageSnapshot || {};
  const totalAmount = payment.amount || quotation?.pricing?.total || quotation?.costing?.grandTotal || 0;
  const travelDate = lead?.travelDate || null;
  let returnDate = lead?.returnDate || null;
  if (travelDate && snap.duration && !returnDate) {
    returnDate = new Date(travelDate);
    returnDate.setDate(returnDate.getDate() + Number(snap.duration));
  }

  return {
    branchId: payment.branchId,
    lead: payment.lead,
    quotation: payment.quotation,
    customerName: payment.customerName || lead?.name || 'Customer',
    customerPhone: lead?.phone || '',
    customerEmail: lead?.email || '',
    destination: lead?.destination || snap.destination || 'TBD',
    packageName: snap.name || snap.title || '',
    travelDate,
    returnDate,
    adults: lead?.adults || lead?.pax || 2,
    children: lead?.children || 0,
    status: payment.status === 'paid' ? 'confirmed' : 'booking_received',
    paymentStatus: payment.status === 'paid' ? 'paid' : payment.status === 'partial' ? 'partial' : 'pending',
    totalAmount,
    advanceReceived: payment.paidAmount || 0,
    pendingAmount: Math.max(0, totalAmount - (payment.paidAmount || 0)),
    quotationReference: quotation?.quoteNumber || '',
    executiveName: executive?.name || '',
    hotels: mapQuoteHotels(quotation?.selectedHotels),
    transport: mapQuoteTransport(quotation?.selectedCabs),
    activities: mapQuoteActivities(quotation?.selectedActivities),
    itinerary: (snap.itinerary || []).map((d, i) => ({
      day: d.day || i + 1,
      title: d.title || '',
      description: d.description || '',
      meals: d.meals || '',
      accommodation: d.accommodation || '',
      transport: d.transport || '',
      activities: d.activities || '',
    })),
    hotelConfirmation: 'pending',
    cabConfirmation: 'pending',
    voucherStatus: 'pending',
  };
}

async function createBookingFromPayment(paymentId, actor) {
  const payment = await Payment.findById(paymentId).lean();
  if (!payment) return null;
  if (payment.booking) return Booking.findById(payment.booking);
  if (!['paid', 'partial'].includes(payment.status)) return null;

  const payload = await buildBookingPayloadFromPayment(payment);
  const booking = await createBooking(payload, actor);

  await Payment.findByIdAndUpdate(paymentId, { booking: booking._id });
  return booking;
}

async function listTasks(query = {}, { branchId } = {}) {
  const filter = withBranch({}, branchId);
  if (query.status) filter.status = query.status;
  if (query.bookingId) filter.booking = query.bookingId;
  return TripTask.find(filter).sort({ dueDate: 1, createdAt: -1 }).limit(100).lean();
}

async function createTask(payload, actor) {
  return TripTask.create({ ...payload, createdBy: actor?._id });
}

async function updateTask(id, payload) {
  const patch = { ...payload };
  if (payload.status === 'completed') patch.completedAt = new Date();
  return TripTask.findByIdAndUpdate(id, patch, { new: true });
}

async function listDocuments(bookingId) {
  return TripDocument.find({ booking: bookingId }).sort({ createdAt: -1 }).lean();
}

async function addDocument(bookingId, payload, actor) {
  const booking = await Booking.findById(bookingId).select('branchId').lean();
  return TripDocument.create({
    ...payload,
    booking: bookingId,
    branchId: booking?.branchId,
    uploadedBy: actor?._id,
  });
}

async function buildReports(branchId) {
  const base = withBranch(notArchivedFilter(), branchId);
  const [byStatus, monthlyTrips, vendorPerformance, payments] = await Promise.all([
    Booking.aggregate([
      { $match: base },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { ...base, travelDate: { $exists: true } } },
      {
        $group: {
          _id: { y: { $year: '$travelDate' }, m: { $month: '$travelDate' } },
          trips: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.y': -1, '_id.m': -1 } },
      { $limit: 12 },
    ]),
    Vendor.aggregate([
      { $match: withBranch({ status: 'active' }, branchId) },
      { $group: { _id: '$type', count: { $sum: 1 }, outstanding: { $sum: '$outstandingBalance' } } },
    ]),
    Payment.aggregate([
      { $match: withBranch({}, branchId) },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
          paid: { $sum: '$paidAmount' },
        },
      },
    ]),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((r) => [r._id, r.count]));
  const totalBookings = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const completedTrips = statusMap.completed || 0;
  const revenue = monthlyTrips.reduce((s, r) => s + (r.revenue || 0), 0);

  const summary = {
    totalBookings,
    activeTrips: statusMap.in_progress || 0,
    completedTrips,
    pendingBookings:
      (statusMap.booking_received || 0) +
      (statusMap.pending_verification || 0) +
      (statusMap.pending || 0),
    revenue,
    fulfillmentRate: totalBookings ? Math.round((completedTrips / totalBookings) * 100) : 0,
    avgTripValue: totalBookings ? Math.round(revenue / totalBookings) : 0,
    activeVendors: vendorPerformance.reduce((s, r) => s + r.count, 0),
  };

  return {
    summary,
    bookingsByStatus: byStatus.map((r) => ({ status: r._id, count: r.count })),
    monthlyTrips: monthlyTrips
      .map((r) => ({
        month: `${String(r._id.m).padStart(2, '0')}/${r._id.y}`,
        trips: r.trips,
        revenue: r.revenue,
      }))
      .reverse(),
    vendorPerformance: vendorPerformance.map((r) => ({
      name: r._id || 'Other',
      bookings: r.count,
      outstanding: r.outstanding || 0,
      rating: '—',
    })),
    payments,
  };
}

async function getTripTracker(branchId) {
  const base = withBranch(notArchivedFilter(), branchId);
  const now = new Date();

  const [upcoming, ongoing, completed, cancelled] = await Promise.all([
    Booking.find({ ...base, travelDate: { $gt: now }, status: { $in: ['confirmed', 'booking_received', 'pending_verification'] } })
      .sort({ travelDate: 1 }).limit(20).lean(),
    Booking.find({ ...base, status: 'in_progress' }).sort({ travelDate: 1 }).limit(20).lean(),
    Booking.find({ ...base, status: 'completed' }).sort({ returnDate: -1 }).limit(20).lean(),
    Booking.find({ ...base, status: { $in: ['cancelled', 'refund_pending', 'refund_completed'] } })
      .sort({ updatedAt: -1 }).limit(20).lean(),
  ]);

  const withCountdown = (rows) =>
    rows.map((b) => {
      const startsInDays = b.travelDate
        ? Math.ceil((new Date(b.travelDate) - now) / 86400000)
        : null;
      return { ...b, startsInDays, tripLabel: startsInDays != null && startsInDays >= 0 ? `Trip starts in ${startsInDays} day(s)` : null };
    });

  return {
    upcoming: withCountdown(upcoming),
    ongoing,
    completed,
    cancelled,
  };
}

module.exports = {
  STATUS_ROUTE_MAP,
  getDashboard,
  listBookings,
  createBooking,
  buildBookingPayloadFromPayment,
  updateBooking,
  createBookingFromPayment,
  listTasks,
  createTask,
  updateTask,
  listDocuments,
  addDocument,
  buildReports,
  getTripTracker,
  nextBookingNumber,
};
