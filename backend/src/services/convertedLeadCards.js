const Booking = require('../models/Booking');
const LeadActivity = require('../models/LeadActivity');

const DAY_MS = 86400000;

function startOfDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function daySpan(from, to) {
  const a = startOfDay(from);
  const b = startOfDay(to);
  if (!a || !b) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / DAY_MS));
}

function daysUntil(date) {
  const target = startOfDay(date);
  if (!target) return null;
  const today = startOfDay(new Date());
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function bookingStatusLabel(status) {
  const labels = {
    booking_received: 'Pending',
    pending_verification: 'Pending',
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refund_pending: 'Refund',
    refund_completed: 'Refunded',
  };
  return labels[status] || 'Pending';
}

function staySummary(lead, booking) {
  const nightsFromBooking = Number(booking?.nights) || 0;
  if (nightsFromBooking > 0) {
    return { nights: nightsFromBooking, days: nightsFromBooking + 1 };
  }
  const from = booking?.travelDate || lead.travelDate;
  const to = booking?.returnDate || lead.returnDate;
  const nights = daySpan(from, to);
  if (nights == null) {
    const tripDays = Number(lead.tripDays) || 0;
    if (tripDays > 1) return { nights: tripDays - 1, days: tripDays };
    return { nights: null, days: null };
  }
  return { nights, days: nights + 1 };
}

function roomCount(booking) {
  const hotels = Array.isArray(booking?.hotels) ? booking.hotels.filter((hotel) => hotel?.hotelName || hotel?.roomType) : [];
  return hotels.length;
}

function buildConversionCard(lead, booking, convertedAt = null) {
  const travelDate = booking?.travelDate || lead.travelDate || null;
  const returnDate = booking?.returnDate || lead.returnDate || null;
  const totalAmount = money(booking?.totalAmount || lead.budget);
  const totalPaid = money(booking?.totalPaid);
  const pendingAmount = booking
    ? money(booking.pendingAmount ?? booking.remainingBalance ?? Math.max(0, totalAmount - totalPaid))
    : Math.max(0, totalAmount - totalPaid);
  const fullyPaid = Boolean(booking) && (booking.paymentStatus === 'paid' || pendingAmount <= 0);
  const progress = totalAmount > 0 ? Math.max(0, Math.min(100, Math.round((totalPaid / totalAmount) * 100))) : (fullyPaid ? 100 : 0);
  const left = daysUntil(travelDate);
  const stay = staySummary(lead, booking);
  const salesName = lead.assignedTo?.name || booking?.executiveName || lead.createdBy?.name || '';

  return {
    bookingId: booking?._id || null,
    bookingNumber: booking?.bookingNumber || '',
    salesBy: salesName,
    destination: booking?.destination || lead.destination || '',
    travelDate,
    returnDate,
    nights: stay.nights,
    days: stay.days,
    adults: Number(booking?.adults ?? lead.adults) || 0,
    children: Number(booking?.children ?? lead.children) || 0,
    rooms: booking ? roomCount(booking) : 0,
    daysLeft: left,
    overdue: Boolean(booking) && !fullyPaid && left != null && left < 0,
    leadToBookingDays: booking ? daySpan(lead.createdAt, booking.createdAt) : null,
    assignedToBookingDays: booking && lead.assignedTo ? daySpan(lead.createdAt, booking.createdAt) : null,
    totalAmount,
    totalPaid,
    pendingAmount,
    paymentProgress: progress,
    fullyPaid,
    paymentStatus: booking?.paymentStatus || (fullyPaid ? 'paid' : 'pending'),
    bookingStatus: booking?.status || '',
    bookingStatusLabel: booking ? bookingStatusLabel(booking.status) : 'No booking',
    nextDueDate: fullyPaid ? null : travelDate,
    hasBooking: Boolean(booking),
    arrivedAt: lead.createdAt || null,
    convertedAt: convertedAt || booking?.createdAt || lead.statusReasonUpdatedAt || null,
  };
}

async function attachConvertedBookingCards(leads = []) {
  const converted = leads.filter((lead) => lead?.status === 'converted' && lead._id);
  if (!converted.length) return leads;

  const bookings = await Booking.find({ lead: { $in: converted.map((lead) => lead._id) } })
    .select('lead bookingNumber destination travelDate returnDate adults children totalAmount totalPaid pendingAmount remainingBalance paymentStatus executiveName createdAt hotels status')
    .sort({ createdAt: -1 })
    .lean();

  const leadIds = converted.map((lead) => lead._id);
  const activities = await LeadActivity.find({ leadId: { $in: leadIds }, type: 'lead_converted' })
    .select('leadId createdAt')
    .sort({ createdAt: 1 })
    .lean();

  const latestByLead = new Map();
  const earliestBookingAt = new Map();
  bookings.forEach((booking) => {
    const key = String(booking.lead);
    if (!latestByLead.has(key)) latestByLead.set(key, booking);
    earliestBookingAt.set(key, booking.createdAt);
  });

  const convertedAtByLead = new Map();
  activities.forEach((activity) => {
    const key = String(activity.leadId);
    if (!convertedAtByLead.has(key)) convertedAtByLead.set(key, activity.createdAt);
  });

  return leads.map((lead) => {
    if (lead?.status !== 'converted') return lead;
    const key = String(lead._id);
    const convertedAt = convertedAtByLead.get(key) || earliestBookingAt.get(key) || lead.statusReasonUpdatedAt || null;
    return {
      ...lead,
      conversionCard: buildConversionCard(lead, latestByLead.get(key) || null, convertedAt),
    };
  });
}

module.exports = {
  attachConvertedBookingCards,
  buildConversionCard,
};
