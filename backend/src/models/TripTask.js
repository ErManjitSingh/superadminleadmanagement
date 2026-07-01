const mongoose = require('mongoose');

const { tenantPlugin } = require('../config/tenantPlugin');
const TASK_TYPES = [
  'hotel_confirmation',
  'cab_confirmation',
  'voucher_creation',
  'payment_verification',
  'activity_booking',
  'general',
];

const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

const tripTaskSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: TASK_TYPES, default: 'general', index: true },
    status: { type: String, enum: TASK_STATUSES, default: 'pending', index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    dueDate: { type: Date, index: true },
    notes: { type: String, trim: true, default: '' },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

tripTaskSchema.index({ status: 1, dueDate: 1 });
tripTaskSchema.index({ branchId: 1, status: 1, createdAt: -1 });

tripTaskSchema.plugin(tenantPlugin);

module.exports = mongoose.model('TripTask', tripTaskSchema);
module.exports.TASK_TYPES = TASK_TYPES;
module.exports.TASK_STATUSES = TASK_STATUSES;
