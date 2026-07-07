const mongoose = require('mongoose');

const platformNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['trial_expiring', 'renewal_due', 'storage_limit', 'company_suspended', 'upgrade_request', 'system', 'security'],
      default: 'system',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info', index: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'platform_notifications' }
);

platformNotificationSchema.index({ read: 1, createdAt: -1 });

module.exports = mongoose.model('PlatformNotification', platformNotificationSchema);
