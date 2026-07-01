const mongoose = require('mongoose');

const { tenantPlugin } = require('../config/tenantPlugin');
const DOCUMENT_TYPES = [
  'customer_id',
  'hotel_confirmation',
  'flight_ticket',
  'bus_ticket',
  'travel_insurance',
  'other',
];

const tripDocumentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    type: { type: String, enum: DOCUMENT_TYPES, required: true, index: true },
    fileName: { type: String, trim: true, default: '' },
    fileUrl: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

tripDocumentSchema.plugin(tenantPlugin);

module.exports = mongoose.model('TripDocument', tripDocumentSchema);
module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
