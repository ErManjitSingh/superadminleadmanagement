const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const whatsAppNoteSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    text: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

whatsAppNoteSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WhatsAppNote', whatsAppNoteSchema);
