const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { createBookingFromPayment } = require('./operationsService');
const { invalidate: invalidateDashboardCache } = require('./dashboardCacheService');
const cacheService = require('./cacheService');
const { notifyUser } = require('./notificationService');

const TERMINAL_STATUSES = ['converted', 'lost', 'booked_from_another_company'];

function isLeadStatusLocked(status) {
  return TERMINAL_STATUSES.includes(status);
}

async function pickQuotationForLead(leadId) {
  const approved = await Quotation.findOne({ lead: leadId, status: 'approved' }).sort({ updatedAt: -1 });
  if (approved) return approved;
  return Quotation.findOne({
    lead: leadId,
    status: { $in: ['approved', 'sent', 'viewed', 'negotiation', 'pending_approval'] },
  }).sort({ updatedAt: -1 });
}

async function ensureQuotationApproved(quotation, actor) {
  if (!quotation || quotation.status === 'approved') return quotation;
  if (['sent', 'viewed', 'negotiation', 'pending_approval'].includes(quotation.status)) {
    quotation.status = 'approved';
    quotation.approvedBy = actor?._id;
    quotation.timeline = quotation.timeline || [];
    quotation.timeline.push({
      type: 'approved',
      date: new Date(),
      user: actor?.name || 'System',
      notes: 'Auto-approved on lead conversion',
    });
    await quotation.save();
  }
  return quotation;
}

async function ensurePaymentForConversion(lead, quotation, actor) {
  let payment = await Payment.findOne({ lead: lead._id }).sort({ createdAt: -1 });
  if (payment) return payment;

  const amount = quotation?.pricing?.total || quotation?.costing?.grandTotal || lead.budget || 0;
  const count = await Payment.countDocuments();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  const paidAmount = amount > 0 ? Math.round(amount * 0.3) : 0;

  payment = await Payment.create({
    invoiceNumber,
    branchId: lead.branchId,
    lead: lead._id,
    quotation: quotation?._id,
    customerName: lead.name,
    amount,
    paidAmount,
    status: paidAmount >= amount && amount > 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
    paidAt: paidAmount > 0 ? new Date() : undefined,
    createdBy: actor?._id || lead.assignedTo,
  });

  return payment;
}

function invalidateDashboards() {
  ['admin', 'sales_manager', 'team_leader', 'sales_executive', 'nav:'].forEach((k) => {
    invalidateDashboardCache(k);
  });
  cacheService.invalidate('ops:').catch(() => {});
}

async function notifyOperationsTeam(lead, booking) {
  const filter = { role: 'operations_manager' };
  if (lead.branchId) filter.branchId = lead.branchId;
  const opsUsers = await User.find(filter).select('_id').lean();
  for (const u of opsUsers) {
    notifyUser(u._id, {
      type: 'operations_task',
      title: 'New booking from converted lead',
      message: `${lead.name} — ${lead.destination}${booking?.bookingNumber ? ` (${booking.bookingNumber})` : ''}`,
      branchId: lead.branchId,
      meta: { bookingId: booking?._id, leadId: lead._id },
    }).catch(() => {});
  }
}

async function onLeadConverted(lead, actor) {
  const existingBooking = await Booking.findOne({ lead: lead._id });
  if (existingBooking) {
    invalidateDashboards();
    return { booking: existingBooking, skipped: true };
  }

  let quotation = await pickQuotationForLead(lead._id);
  quotation = await ensureQuotationApproved(quotation, actor);

  if (quotation) {
    const total = quotation.pricing?.total || quotation.costing?.grandTotal || 0;
    if (total > 0 && (!lead.budget || lead.budget < total)) {
      lead.budget = total;
      await Lead.findByIdAndUpdate(lead._id, { budget: total });
    }
  }

  const payment = await ensurePaymentForConversion(lead, quotation, actor);
  const booking = await createBookingFromPayment(payment._id, actor);

  if (booking) {
    await notifyOperationsTeam(lead, booking);
  }

  invalidateDashboards();
  return { booking, payment, quotation };
}

module.exports = {
  onLeadConverted,
  isLeadStatusLocked,
  TERMINAL_STATUSES,
};
