const mongoose = require('mongoose');

const COMPANY_STATUSES = ['active', 'inactive', 'suspended', 'trial', 'expired'];

const featureFlagsSchema = new mongoose.Schema(
  {
    crm: { type: Boolean, default: true },
    bookings: { type: Boolean, default: true },
    packages: { type: Boolean, default: true },
    hotels: { type: Boolean, default: false },
    transport: { type: Boolean, default: false },
    activities: { type: Boolean, default: false },
    reports: { type: Boolean, default: true },
    calendar: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
    email: { type: Boolean, default: true },
    api: { type: Boolean, default: false },
    payments: { type: Boolean, default: false },
    invoices: { type: Boolean, default: false },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    primaryDomain: { type: String, trim: true, default: null },
    logo: { type: String, default: null },
    ownerName: { type: String, required: true, trim: true },
    ownerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    address: { type: String, trim: true },
    gst: { type: String, trim: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    subscriptionPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', index: true },
    status: { type: String, enum: COMPANY_STATUSES, default: 'trial', index: true },
    storageLimitGb: { type: Number, default: 5 },
    storageUsedMb: { type: Number, default: 0 },
    trialEndDate: { type: Date, index: true },
    renewDate: { type: Date, index: true },
    features: { type: featureFlagsSchema, default: () => ({}) },
    tenantSettings: {
      smtpHost: { type: String, default: '' },
      smtpPort: { type: Number, default: 465 },
      smtpUser: { type: String, default: '' },
      smtpPass: { type: String, default: '' },
      smtpFromName: { type: String, default: '' },
      whatsappApiUrl: { type: String, default: '' },
      whatsappApiKey: { type: String, default: '' },
      smsGatewayUrl: { type: String, default: '' },
      googleMapsApiKey: { type: String, default: '' },
      cloudinaryCloudName: { type: String, default: '' },
      cloudinaryApiKey: { type: String, default: '' },
      brandLogoUrl: { type: String, default: '' },
      brandFaviconUrl: { type: String, default: '' },
    },
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isLegacy: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  },
  { timestamps: true, collection: 'companies' }
);

companySchema.index({ primaryDomain: 1 }, { unique: true, sparse: true, background: true });
companySchema.index({ status: 1, createdAt: -1 });
companySchema.index({ deletedAt: 1, status: 1 });

companySchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('Company', companySchema);
module.exports.COMPANY_STATUSES = COMPANY_STATUSES;
