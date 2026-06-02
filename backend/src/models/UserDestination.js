const mongoose = require('mongoose');

const userDestinationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    destinationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  },
  { timestamps: true }
);

userDestinationSchema.index({ userId: 1, destinationId: 1 }, { unique: true });
userDestinationSchema.index({ branchId: 1, destinationId: 1 });

module.exports = mongoose.model('UserDestination', userDestinationSchema);
