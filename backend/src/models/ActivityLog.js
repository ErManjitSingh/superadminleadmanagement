const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

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
/** Auto-delete entries older than 24 hours */
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

activityLogSchema.plugin(tenantPlugin);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
