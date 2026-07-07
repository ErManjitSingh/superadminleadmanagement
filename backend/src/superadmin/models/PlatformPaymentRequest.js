const mongoose = require('mongoose');

// A tenant-submitted renewal/upgrade payment (paid via UPI to the platform UPI ID).
// Super Admin reviews it and, on approval, the company's plan is auto-extended.
const platformPaymentRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    companyName: { type: String, trim: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    planName: { type: String, trim: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    upiId: { type: String, trim: true },
    // UPI transaction reference / UTR number entered by the tenant after paying
    referenceNumber: { type: String, trim: true },
    payerNote: { type: String, trim: true },
    status: {
      type: String,
      enum: ['submitted', 'approved', 'rejected'],
      default: 'submitted',
      index: true,
    },
    submittedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedByEmail: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true },
    extendedUntil: { type: Date },
  },
  { timestamps: true, collection: 'platform_payment_requests' }
);

platformPaymentRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PlatformPaymentRequest', platformPaymentRequestSchema);
