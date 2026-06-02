const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    customerName: { type: String, required: true },
    destination: { type: String, required: true },
    travelDate: { type: Date, index: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    hotels: [{ type: mongoose.Schema.Types.Mixed }],
    transport: [{ type: mongoose.Schema.Types.Mixed }],
    activities: [{ type: mongoose.Schema.Types.Mixed }],
    hotelConfirmation: { type: String, default: 'pending' },
    cabConfirmation: { type: String, default: 'pending' },
    totalAmount: { type: Number, default: 0 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bookingSchema.index({ travelDate: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
