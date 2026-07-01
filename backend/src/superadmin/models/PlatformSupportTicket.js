const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    authorType: { type: String, enum: ['superadmin', 'company'], required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId },
    authorName: { type: String, trim: true },
    message: { type: String, required: true },
    isInternal: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const platformSupportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    companyName: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['open', 'pending', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    replies: [replySchema],
    internalNotes: [{ note: String, authorId: mongoose.Schema.Types.ObjectId, createdAt: { type: Date, default: Date.now } }],
    resolvedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true, collection: 'platform_support_tickets' },
);

module.exports = mongoose.model('PlatformSupportTicket', platformSupportTicketSchema);
