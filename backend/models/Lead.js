const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    travelDate: { type: Date },
    budget: { type: Number, default: 0 },
    travelers: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
      default: 'new',
    },
    source: {
      type: String,
      enum: ['website', 'referral', 'social', 'walk-in', 'phone', 'other'],
      default: 'website',
    },
    notes: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);
