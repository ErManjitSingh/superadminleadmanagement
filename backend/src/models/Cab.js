const mongoose = require('mongoose');

const cabSchema = new mongoose.Schema(
  {
    vehicleType: { type: String, required: true },
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    cost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cab', cabSchema);
