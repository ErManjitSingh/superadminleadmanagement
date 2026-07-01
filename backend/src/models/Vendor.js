const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const VENDOR_TYPES = ['hotel', 'transport', 'activity', 'local_guide', 'other'];

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: VENDOR_TYPES, default: 'hotel', index: true },
    contactPerson: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    destination: { type: String, trim: true, index: true },
    commission: { type: Number, default: 0, min: 0 },
    outstandingBalance: { type: Number, default: 0 },
    rating: { type: Number, default: 4 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

vendorSchema.index({ name: 'text', destination: 'text' });

vendorSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Vendor', vendorSchema);
module.exports.VENDOR_TYPES = VENDOR_TYPES;
