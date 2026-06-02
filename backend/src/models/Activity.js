const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    vendorName: { type: String },
    destination: { type: String },
    duration: { type: String },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
