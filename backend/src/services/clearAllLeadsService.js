const Lead = require('../models/Lead');
const LeadNote = require('../models/LeadNote');
const FollowUp = require('../models/FollowUp');
const Quotation = require('../models/Quotation');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppNote = require('../models/WhatsAppNote');
const LeadAssignmentLog = require('../models/LeadAssignmentLog');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { invalidate: invalidateDashboardCache } = require('./dashboardCacheService');

async function clearAllLeadsData() {
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
    LeadNote.deleteMany({}),
    FollowUp.deleteMany({}),
    Quotation.deleteMany({}),
    WhatsAppMessage.deleteMany({}),
    WhatsAppNote.deleteMany({}),
    LeadAssignmentLog.deleteMany({}),
    Payment.deleteMany({}),
    Booking.deleteMany({}),
    Lead.deleteMany({}),
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
