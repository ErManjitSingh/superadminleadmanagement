const mongoose = require('mongoose');

const { tenantPlugin } = require('../config/tenantPlugin');
const leadMergeLogSchema = new mongoose.Schema(
  {
    sourceLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    targetLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    mergedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sourceSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

leadMergeLogSchema.index({ targetLeadId: 1, createdAt: -1 });

leadMergeLogSchema.plugin(tenantPlugin);

module.exports = mongoose.model('LeadMergeLog', leadMergeLogSchema);
