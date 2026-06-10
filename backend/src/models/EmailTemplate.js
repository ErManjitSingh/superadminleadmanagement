const mongoose = require('mongoose');

const EMAIL_TEMPLATE_CATEGORIES = [
  'quotation',
  'follow_up',
  'booking_confirmation',
  'payment_confirmation',
  'welcome',
  'reactivation',
  'custom',
];

const emailTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: EMAIL_TEMPLATE_CATEGORIES,
      default: 'custom',
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

emailTemplateSchema.index({ branchId: 1, category: 1, enabled: 1, sortOrder: 1 });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
module.exports.EMAIL_TEMPLATE_CATEGORIES = EMAIL_TEMPLATE_CATEGORIES;
