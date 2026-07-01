const mongoose = require("mongoose");

const COMPANY_STATUSES = [
  "active",
  "inactive",
  "suspended",
  "trial",
  "expired",
  "pending_verification",
];

const SSL_STATUSES = ["not_applicable", "pending", "active", "failed"];

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
  { _id: false },
);

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    subdomain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    primaryDomain: { type: String, trim: true, default: null },
    domainType: {
      type: String,
      enum: ["subdomain", "custom"],
      default: "subdomain",
    },
    domainVerified: { type: Boolean, default: false },
    domainLastVerifiedAt: { type: Date, default: null },
    sslStatus: {
      type: String,
      enum: SSL_STATUSES,
      default: "not_applicable",
    },
    sslLastCheckedAt: { type: Date, default: null },
    additionalDomains: [
      {
        domain: { type: String, trim: true },
        verified: { type: Boolean, default: false },
        sslStatus: { type: String, enum: SSL_STATUSES, default: "pending" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    businessType: { type: String, trim: true, default: "" },
    logo: { type: String, default: null },
    ownerName: { type: String, required: true, trim: true },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ownerEmailVerified: { type: Boolean, default: false },
    ownerEmailVerificationToken: { type: String, default: null, select: false },
    ownerEmailVerificationExpires: { type: Date, default: null, select: false },
    phone: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    address: { type: String, trim: true },
    gst: { type: String, trim: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    currency: { type: String, default: "INR" },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    autoRenewal: { type: Boolean, default: true },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      index: true,
    },
    status: {
      type: String,
      enum: COMPANY_STATUSES,
      default: "trial",
      index: true,
    },
    storageLimitGb: { type: Number, default: 5 },
    storageUsedMb: { type: Number, default: 0 },
    trialEndDate: { type: Date, index: true },
    renewDate: { type: Date, index: true },
    maintenanceMode: { type: Boolean, default: false },
    onboarding: {
      companyCreated: { type: Boolean, default: true },
      emailVerified: { type: Boolean, default: false },
      domainConnected: { type: Boolean, default: false },
      profileCompleted: { type: Boolean, default: false },
      logoUploaded: { type: Boolean, default: false },
      firstUserAdded: { type: Boolean, default: false },
      firstLeadAdded: { type: Boolean, default: false },
      firstQuotationCreated: { type: Boolean, default: false },
    },
    whiteLabel: {
      appTitle: { type: String, default: "" },
      primaryColor: { type: String, default: "#7c3aed" },
      secondaryColor: { type: String, default: "#4f46e5" },
      sidebarColor: { type: String, default: "#0f172a" },
      emailLogoUrl: { type: String, default: "" },
      invoiceLogoUrl: { type: String, default: "" },
      quotationLogoUrl: { type: String, default: "" },
    },
    features: { type: featureFlagsSchema, default: () => ({}) },
    tenantSettings: {
      smtpHost: { type: String, default: "" },
      smtpPort: { type: Number, default: 465 },
      smtpUser: { type: String, default: "" },
      smtpPass: { type: String, default: "" },
      smtpFromName: { type: String, default: "" },
      whatsappApiUrl: { type: String, default: "" },
      whatsappApiKey: { type: String, default: "" },
      smsGatewayUrl: { type: String, default: "" },
      googleMapsApiKey: { type: String, default: "" },
      cloudinaryCloudName: { type: String, default: "" },
      cloudinaryApiKey: { type: String, default: "" },
      brandLogoUrl: { type: String, default: "" },
      brandFaviconUrl: { type: String, default: "" },
    },
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isLegacy: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin" },
  },
  { timestamps: true, collection: "companies" },
);

companySchema.index(
  { primaryDomain: 1 },
  { unique: true, sparse: true, background: true },
);
companySchema.index({ status: 1, createdAt: -1 });
companySchema.index({ deletedAt: 1, status: 1 });

companySchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model("Company", companySchema);
module.exports.COMPANY_STATUSES = COMPANY_STATUSES;
module.exports.SSL_STATUSES = SSL_STATUSES;
