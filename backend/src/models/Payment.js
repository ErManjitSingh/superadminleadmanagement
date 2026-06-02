const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    customerName: { type: String, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded', 'cancelled'],
      default: 'pending',
    },
    method: { type: String, enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque'], default: 'bank_transfer' },
    dueDate: { type: Date },
    paidAt: { type: Date },
    refunds: [
      {
        amount: Number,
        reason: String,
        date: { type: Date, default: Date.now },
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
