const mongoose = require('mongoose');

const platformAuditLogSchema = new mongoose.Schema(
  {
    actorType: { type: String, enum: ['super_admin', 'system'], default: 'super_admin' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    actorEmail: { type: String, trim: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'platform_audit_logs' }
);

platformAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PlatformAuditLog', platformAuditLogSchema);
