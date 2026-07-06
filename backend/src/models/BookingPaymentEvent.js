const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const EVENT_TYPES = [
  'lead_converted',
  'advance_payment',
  'payment_received',
  'receipt_generated',
  'whatsapp_sent',
  'email_sent',
  'booking_created',
  'operations_assigned',
  'payment_reminder',
  'booking_fully_paid',
  'receipt_resent',
];

const bookingPaymentEventSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'BookingPayment' },
    type: { type: String, enum: EVENT_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, trim: true, default: 'System' },
    actorRole: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    amount: { type: Number },
    paymentMode: { type: String, trim: true, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bookingPaymentEventSchema.index({ booking: 1, createdAt: -1 });

bookingPaymentEventSchema.plugin(tenantPlugin);

module.exports = mongoose.model('BookingPaymentEvent', bookingPaymentEventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
