const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const VOUCHER_TYPES = ['hotel', 'transport', 'activity', 'master'];
const VOUCHER_STATUSES = ['draft', 'issued', 'sent', 'redeemed'];

const voucherSchema = new mongoose.Schema(
  {
    voucherNumber: { type: String, required: true, unique: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    bookingNumber: { type: String },
    customerName: { type: String },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    type: { type: String, enum: VOUCHER_TYPES, default: 'hotel', index: true },
    status: { type: String, enum: VOUCHER_STATUSES, default: 'draft', index: true },
    pdfUrl: { type: String, trim: true, default: '' },
    details: { type: mongoose.Schema.Types.Mixed },
    issuedAt: { type: Date },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

voucherSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Voucher', voucherSchema);
module.exports.VOUCHER_TYPES = VOUCHER_TYPES;
module.exports.VOUCHER_STATUSES = VOUCHER_STATUSES;
