const mongoose = require('mongoose');

const TRANSFER_TYPES = ['assign', 'reassign', 'bulk_assign', 'branch_transfer'];

const leadTransferLogSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    type: { type: String, enum: TRANSFER_TYPES, required: true, index: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fromBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    toBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, trim: true },
    note: { type: String, trim: true, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

leadTransferLogSchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model('LeadTransferLog', leadTransferLogSchema);
module.exports.TRANSFER_TYPES = TRANSFER_TYPES;
