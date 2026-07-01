const mongoose = require('mongoose');

const { tenantPlugin } = require('../config/tenantPlugin');
const CALL_OUTCOMES = [
  'interested',
  'need_better_hotel',
  'budget_issue',
  'call_back_tomorrow',
  'not_interested',
  'no_answer',
  'other',
];

const callNoteSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    outcome: { type: String, enum: CALL_OUTCOMES, required: true },
    notes: { type: String, required: true, trim: true },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

callNoteSchema.index({ leadId: 1, createdAt: -1 });

callNoteSchema.plugin(tenantPlugin);

module.exports = mongoose.model('CallNote', callNoteSchema);
module.exports.CALL_OUTCOMES = CALL_OUTCOMES;
