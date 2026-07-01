const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    meals: { type: String, default: '' },
    accommodation: { type: String, default: '' },
  },
  { _id: true }
);

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1 },
    startingPrice: { type: Number, default: 0 },
    packageType: {
      type: String,
      enum: ['honeymoon', 'family', 'group', 'adventure', 'luxury', 'corporate'],
      default: 'family',
    },
    itinerary: [itineraryDaySchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

packageSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Package', packageSchema);
