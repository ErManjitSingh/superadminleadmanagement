const mongoose = require('mongoose');

const ESCALATION_LEVELS = ['15m', '30m', '1h'];

const leadEscalationSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    followUpId: { type: mongoose.Schema.Types.ObjectId, ref: 'FollowUp', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    level: { type: String, enum: ESCALATION_LEVELS, required: true },
    minutesOverdue: { type: Number, default: 0 },
    notifiedRoles: [{ type: String }],
    resolvedAt: { type: Date },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

leadEscalationSchema.index({ followUpId: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('LeadEscalation', leadEscalationSchema);
module.exports.ESCALATION_LEVELS = ESCALATION_LEVELS;
