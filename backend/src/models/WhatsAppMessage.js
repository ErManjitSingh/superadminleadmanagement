const mongoose = require('mongoose');

const whatsAppMessageSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
    type: { type: String, enum: ['text', 'image', 'document', 'audio'], default: 'text' },
    text: { type: String, default: '' },
    attachment: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    timestamp: { type: Date, default: Date.now },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WhatsAppMessage', whatsAppMessageSchema);
