const mongoose = require('mongoose');

const websiteLeadSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['booking', 'contact', 'newsletter', 'callback'],
      required: true,
      index: true,
    },
    name: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    message: { type: String, default: '' },
    trekId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteTrek', default: null },
    trekTitle: { type: String, default: '' },
    destinationId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteDestination', default: null },
    preferredDate: { type: Date, default: null },
    travelers: { type: Number, default: 1 },
    sourcePage: { type: String, default: '' },
    utmSource: { type: String, default: '' },
    utmMedium: { type: String, default: '' },
    utmCampaign: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'converted', 'closed', 'spam'],
      default: 'new',
      index: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', default: null },
    assignedToName: { type: String, default: '' },
    notes: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'website_leads' },
);

websiteLeadSchema.index({ createdAt: -1 });
websiteLeadSchema.index({ type: 1, status: 1, createdAt: -1 });
websiteLeadSchema.index({ email: 1 });
websiteLeadSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteLead', websiteLeadSchema);
