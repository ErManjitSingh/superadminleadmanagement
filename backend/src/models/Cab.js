const mongoose = require('mongoose');

const CAB_STATUSES = ['available', 'on_trip', 'maintenance', 'unavailable'];

const cabSchema = new mongoose.Schema(
  {
    vehicleName: { type: String, trim: true, default: '' },
    vehicleType: { type: String, required: true },
    registrationNumber: { type: String, trim: true, default: '' },
    color: { type: String, trim: true, default: '' },
    fuelType: { type: String, trim: true, default: '' },
    capacity: { type: Number, default: 4 },
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    pickupAddress: { type: String, trim: true, default: '' },
    dropAddress: { type: String, trim: true, default: '' },
    pickupDate: { type: Date },
    dropDate: { type: Date },
    tripType: { type: String, trim: true, default: 'One Way' },
    cost: { type: Number, default: 0 },
    status: { type: String, enum: CAB_STATUSES, default: 'available', index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
  },
  { timestamps: true }
);

cabSchema.index({ vehicleName: 'text', vehicleType: 'text', pickupLocation: 'text', dropLocation: 'text' });

module.exports = mongoose.model('Cab', cabSchema);
module.exports.CAB_STATUSES = CAB_STATUSES;
