const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    voucherNumber: { type: String, required: true, unique: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    bookingNumber: { type: String },
    customerName: { type: String },
    type: { type: String, enum: ['hotel', 'transport', 'activity'], default: 'hotel' },
    status: { type: String, enum: ['draft', 'issued', 'sent'], default: 'draft' },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Voucher', voucherSchema);
