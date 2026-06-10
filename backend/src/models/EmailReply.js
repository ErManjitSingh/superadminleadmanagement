const mongoose = require('mongoose');

const emailReplySchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
    emailLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailLog' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    fromEmail: { type: String, trim: true, required: true },
    fromName: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    snippet: { type: String, trim: true, maxlength: 1000 },
    receivedAt: { type: Date, index: true },
    notifiedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

emailReplySchema.index({ leadId: 1, receivedAt: -1 });

module.exports = mongoose.model('EmailReply', emailReplySchema);
