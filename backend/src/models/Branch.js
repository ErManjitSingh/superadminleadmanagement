const mongoose = require('mongoose');

const { tenantPlugin } = require('../config/tenantPlugin');
const branchSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true, default: null },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

branchSchema.index({ companyId: 1, code: 1 }, { unique: true });
branchSchema.index({ companyId: 1, name: 1 }, { unique: true });

branchSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Branch', branchSchema);
