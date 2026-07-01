const mongoose = require('mongoose');

const companyLoginLogSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String, trim: true },
    loginType: { type: String, enum: ['user', 'impersonation'], default: 'user' },
    impersonatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    ipAddress: { type: String },
    userAgent: { type: String },
    success: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'company_login_logs' }
);

companyLoginLogSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('CompanyLoginLog', companyLoginLogSchema);
