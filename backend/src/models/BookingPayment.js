const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const PAYMENT_MODES = ['cash', 'upi', 'bank_transfer', 'credit_card', 'debit_card', 'cheque'];
const PAYMENT_TYPES = ['advance', 'installment', 'final'];
const DEPARTMENTS = ['sales', 'operations', 'admin'];

const bookingPaymentSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    customerName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, default: Date.now, index: true },
    mode: { type: String, enum: PAYMENT_MODES, required: true },
    transactionId: { type: String, trim: true, default: '' },
    referenceNumber: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    remarks: { type: String, trim: true, default: '' },
    screenshotUrl: { type: String, trim: true, default: '' },
    paymentType: { type: String, enum: PAYMENT_TYPES, default: 'installment' },
    isFirstAdvance: { type: Boolean, default: false, index: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    receiptPdfUrl: { type: String, trim: true, default: '' },
    receiptPdfPath: { type: String, trim: true, default: '' },
    receiptFileName: { type: String, trim: true, default: '' },
    whatsappSentAt: { type: Date },
    emailSentAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByRole: { type: String, trim: true, default: '' },
    createdByName: { type: String, trim: true, default: '' },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingPaymentSchema.index({ booking: 1, createdAt: -1 });
bookingPaymentSchema.index({ branchId: 1, paymentDate: -1 });

bookingPaymentSchema.plugin(tenantPlugin);

module.exports = mongoose.model('BookingPayment', bookingPaymentSchema);
module.exports.PAYMENT_MODES = PAYMENT_MODES;
module.exports.PAYMENT_TYPES = PAYMENT_TYPES;
module.exports.DEPARTMENTS = DEPARTMENTS;
