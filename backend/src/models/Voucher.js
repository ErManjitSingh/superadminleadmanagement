const mongoose = require('mongoose');
const crypto = require('crypto');
const { tenantPlugin } = require('../config/tenantPlugin');

const VOUCHER_TYPES = ['hotel', 'transport', 'activity', 'flight', 'travel_kit', 'master'];
const VOUCHER_STATUSES = [
  'draft',
  'issued',
  'sent',
  'vendor_pending',
  'vendor_confirmed',
  'vendor_rejected',
  'vendor_changes',
  'delivered',
  'archived',
  'redeemed',
];
const VENDOR_STATUSES = ['pending', 'confirmed', 'rejected', 'changes_requested'];

const deliverySchema = new mongoose.Schema(
  {
    email: {
      status: { type: String, enum: ['pending', 'sent', 'delivered', 'opened', 'failed'], default: 'pending' },
      sentAt: Date,
      deliveredAt: Date,
      openedAt: Date,
      lastError: String,
    },
    whatsapp: {
      status: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' },
      sentAt: Date,
      lastError: String,
    },
  },
  { _id: false }
);

const voucherSchema = new mongoose.Schema(
  {
    voucherNumber: { type: String, required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    bookingNumber: { type: String },
    customerName: { type: String },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    type: { type: String, enum: VOUCHER_TYPES, default: 'hotel', index: true },
    status: { type: String, enum: VOUCHER_STATUSES, default: 'draft', index: true },
    isActive: { type: Boolean, default: true, index: true },
    version: { type: Number, default: 1 },
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
    archivedAt: Date,
    assignmentIndex: { type: Number, default: 0 },
    assignmentKey: { type: String, trim: true, default: '' },
    pdfUrl: { type: String, trim: true, default: '' },
    filePath: { type: String, trim: true, default: '' },
    fileName: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: 'application/pdf' },
    fileSize: { type: Number, default: 0 },
    htmlUrl: { type: String, trim: true, default: '' },
    details: { type: mongoose.Schema.Types.Mixed },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    vendorStatus: { type: String, enum: VENDOR_STATUSES, default: 'pending', index: true },
    vendorConfirmationToken: { type: String },
    vendorConfirmationUrl: { type: String, trim: true, default: '' },
    vendorRespondedAt: Date,
    vendorNotes: { type: String, trim: true, default: '' },
    delivery: { type: deliverySchema, default: () => ({}) },
    issuedAt: { type: Date },
    sentAt: { type: Date },
    generatedAt: { type: Date },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

voucherSchema.index({ booking: 1, type: 1, assignmentIndex: 1, isActive: 1 });
voucherSchema.index(
  { voucherNumber: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
voucherSchema.index({ vendorConfirmationToken: 1 }, { sparse: true });

voucherSchema.pre('validate', function ensureVendorToken() {
  if (this.isNew && !this.vendorConfirmationToken) {
    this.vendorConfirmationToken = crypto.randomBytes(24).toString('hex');
  }
});

voucherSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Voucher', voucherSchema);
module.exports.VOUCHER_TYPES = VOUCHER_TYPES;
module.exports.VOUCHER_STATUSES = VOUCHER_STATUSES;
module.exports.VENDOR_STATUSES = VENDOR_STATUSES;
