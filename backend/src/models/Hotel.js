const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: '4 Star' },
    location: { type: String, required: true },
    roomType: { type: String, default: 'Standard' },
    mealPlan: { type: String, default: 'CP (Breakfast)' },
    price: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hotel', hotelSchema);
