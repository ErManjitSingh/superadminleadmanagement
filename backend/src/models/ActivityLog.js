const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    user: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    action: { type: String, required: true },
    target: { type: String, default: '—' },
    ip: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

activityLogSchema.index({ branchId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
