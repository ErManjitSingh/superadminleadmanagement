const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const leadNoteSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    text: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

leadNoteSchema.plugin(tenantPlugin);

module.exports = mongoose.model('LeadNote', leadNoteSchema);
