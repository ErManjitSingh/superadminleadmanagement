const mongoose = require('mongoose');

const websiteActivityLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', default: null },
    actorEmail: { type: String, default: '' },
    actorName: { type: String, default: '' },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'published', 'archived', 'duplicated', 'login', 'exported', 'sorted', 'uploaded'],
      required: true,
      index: true,
    },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    title: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true, collection: 'website_activity_logs' },
);

websiteActivityLogSchema.index({ createdAt: -1 });
websiteActivityLogSchema.index({ resourceType: 1, createdAt: -1 });

module.exports = mongoose.model('WebsiteActivityLog', websiteActivityLogSchema);
