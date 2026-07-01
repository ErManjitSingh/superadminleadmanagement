const mongoose = require('mongoose');

const platformAnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['all', 'selected', 'plan'],
      default: 'all',
    },
    targetCompanyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
    targetPlanIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' }],
    channels: {
      type: [String],
      enum: ['dashboard_banner', 'email', 'popup'],
      default: ['dashboard_banner'],
    },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    publishedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  },
  { timestamps: true, collection: 'platform_announcements' },
);

module.exports = mongoose.model('PlatformAnnouncement', platformAnnouncementSchema);
