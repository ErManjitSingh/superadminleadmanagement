const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const quotationFileSchema = new mongoose.Schema(
  {
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
      default: null,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
      default: null,
    },
    fileName: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true, trim: true },
    mimeType: { type: String, default: 'application/pdf' },
    fileSize: { type: Number, default: 0 },
    storagePath: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
    contentHash: { type: String, default: '', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'quotationfiles' }
);

quotationFileSchema.index({ companyId: 1, quotationId: 1, version: -1 });
quotationFileSchema.index(
  { quotationId: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true, deletedAt: null },
  }
);

quotationFileSchema.plugin(tenantPlugin);

module.exports = mongoose.model('QuotationFile', quotationFileSchema);
