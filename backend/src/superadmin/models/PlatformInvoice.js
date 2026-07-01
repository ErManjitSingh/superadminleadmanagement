const mongoose = require('mongoose');

const platformInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    status: {
      type: String,
      enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
      index: true,
    },
    dueDate: { type: Date },
    paidAt: { type: Date },
    periodStart: { type: Date },
    periodEnd: { type: Date },
  },
  { timestamps: true, collection: 'platform_invoices' },
);

module.exports = mongoose.model('PlatformInvoice', platformInvoiceSchema);
