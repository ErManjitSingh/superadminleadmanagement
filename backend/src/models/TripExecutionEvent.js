const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const EVENT_TYPES = [
  'booking_confirmed',
  'hotel_assigned',
  'cab_assigned',
  'activity_assigned',
  'voucher_generated',
  'voucher_sent',
  'voucher_regenerated',
  'vendor_confirmed',
  'vendor_rejected',
  'vendor_changes_requested',
  'customer_viewed',
  'trip_started',
  'trip_completed',
  'travel_kit_generated',
  'email_sent',
  'whatsapp_sent',
];

const tripExecutionEventSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', index: true },
    type: { type: String, enum: EVENT_TYPES, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, default: 'System' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
  },
  { timestamps: true }
);

tripExecutionEventSchema.index({ booking: 1, createdAt: -1 });

tripExecutionEventSchema.plugin(tenantPlugin);

module.exports = mongoose.model('TripExecutionEvent', tripExecutionEventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
