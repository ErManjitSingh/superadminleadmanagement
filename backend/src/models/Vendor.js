const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['hotel', 'transport', 'activity', 'other'], default: 'hotel' },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
    location: { type: String },
    rating: { type: Number, default: 4 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vendor', vendorSchema);
