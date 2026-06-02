const mongoose = require('mongoose');

const followupSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'whatsapp', 'other'],
      default: 'call',
    },
    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Followup', followupSchema);
