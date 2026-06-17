const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema(
  {
    airline: { type: String, required: true },
    flightNumber: { type: String, required: true },
    departure: { type: String, required: true },
    arrival: { type: String, required: true },
    departureTime: { type: Date },
    arrivalTime: { type: Date },
    cost: { type: Number, default: 0 },
    status: { type: String, enum: ['available', 'booked', 'cancelled'], default: 'available', index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Flight', flightSchema);
