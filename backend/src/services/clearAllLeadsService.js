const Lead = require('../models/Lead');
const LeadNote = require('../models/LeadNote');
const FollowUp = require('../models/FollowUp');
const Quotation = require('../models/Quotation');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppNote = require('../models/WhatsAppNote');
const LeadAssignmentLog = require('../models/LeadAssignmentLog');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const ApiError = require('../utils/apiError');
const { normalizeCompanyId } = require('../utils/branchScope');
const { invalidate: invalidateDashboardCache } = require('./dashboardCacheService');

async function clearAllLeadsData(companyId) {
  if (!companyId) {
    throw new ApiError(403, 'Company scope required to clear leads');
  }
  const scoped = { companyId: normalizeCompanyId(companyId) };

  const [
    notes,
    followups,
    quotations,
    waMessages,
    waNotes,
    assignmentLogs,
    payments,
    bookings,
    leads,
  ] = await Promise.all([
    LeadNote.deleteMany(scoped),
    FollowUp.deleteMany(scoped),
    Quotation.deleteMany(scoped),
    WhatsAppMessage.deleteMany(scoped),
    WhatsAppNote.deleteMany(scoped),
    LeadAssignmentLog.deleteMany(scoped),
    Payment.deleteMany(scoped),
    Booking.deleteMany(scoped),
    Lead.deleteMany(scoped),
  ]);

  invalidateDashboardCache('admin');

  return {
    leads: leads.deletedCount,
    followups: followups.deletedCount,
    quotations: quotations.deletedCount,
    notes: notes.deletedCount,
    assignmentLogs: assignmentLogs.deletedCount,
    payments: payments.deletedCount,
    bookings: bookings.deletedCount,
    whatsappMessages: waMessages.deletedCount,
    whatsappNotes: waNotes.deletedCount,
  };
}

module.exports = { clearAllLeadsData };
