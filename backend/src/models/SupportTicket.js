const mongoose = require('mongoose');

const ISSUE_CATEGORIES = [
  'hotel_issue',
  'cab_delay',
  'refund_request',
  'activity_issue',
  'payment_issue',
  'general',
];

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    customerName: { type: String, required: true },
    category: { type: String, enum: ISSUE_CATEGORIES, default: 'general', index: true },
    subject: { type: String, required: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdate: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
module.exports.ISSUE_CATEGORIES = ISSUE_CATEGORIES;
