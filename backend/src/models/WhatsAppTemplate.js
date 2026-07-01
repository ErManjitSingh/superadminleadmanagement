const mongoose = require('mongoose');

const { tenantPlugin } = require('../config/tenantPlugin');
const whatsAppTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

whatsAppTemplateSchema.index({ branchId: 1, enabled: 1, sortOrder: 1 });

whatsAppTemplateSchema.plugin(tenantPlugin);

module.exports = mongoose.model('WhatsAppTemplate', whatsAppTemplateSchema);
