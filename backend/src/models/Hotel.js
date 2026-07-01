const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const roomTypeSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    maxOccupancy: { type: Number, default: 2 },
    baseRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const contractRateSchema = new mongoose.Schema(
  {
    season: { type: String, trim: true, default: 'standard' },
    roomType: { type: String, trim: true, default: '' },
    rate: { type: Number, default: 0 },
    mealPlan: { type: String, trim: true, default: '' },
    validFrom: Date,
    validTo: Date,
  },
  { _id: false }
);

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    destination: { type: String, trim: true, index: true },
    category: { type: String, default: '4 Star' },
    location: { type: String, required: true },
    address: { type: String, trim: true, default: '' },
    contactPerson: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    roomTypes: [roomTypeSchema],
    roomType: { type: String, default: 'Standard' },
    mealPlan: { type: String, default: 'CP (Breakfast)' },
    price: { type: Number, default: 0 },
    contractRates: [contractRateSchema],
    specialNotes: { type: String, trim: true, default: '' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

hotelSchema.index({ name: 'text', destination: 'text', location: 'text' });

hotelSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Hotel', hotelSchema);
