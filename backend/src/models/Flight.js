const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema(
  {
    airline: { type: String, required: true },
    flightNumber: { type: String, required: true },
    departure: { type: String, required: true },
    arrival: { type: String, required: true },
    cost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Flight', flightSchema);
