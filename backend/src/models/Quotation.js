const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const QUOTE_STATUSES = [
  'draft',
  'pending_approval',
  'sent',
  'viewed',
  'negotiation',
  'approved',
  'accepted',
  'rejected',
  'expired',
  'booked',
];

const timelineSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    date: { type: Date, default: Date.now },
    user: { type: String },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    quoteNumber: { type: String, required: true, unique: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    packageSnapshot: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: QUOTE_STATUSES, default: 'draft', index: true },
    templateKey: { type: String, default: '' },
    shareToken: { type: String, index: true, sparse: true },
    pdfUrl: { type: String, trim: true, default: '' },
    packageInfo: {
      packageName: { type: String, default: '' },
      destination: { type: String, default: '' },
      duration: { type: Number, default: 0 },
      travelDate: { type: Date },
      adults: { type: Number, default: 2 },
      children: { type: Number, default: 0 },
      infants: { type: Number, default: 0 },
      mealPlan: { type: String, default: '' },
      hotelCategory: { type: String, default: '' },
      transportation: { type: String, default: '' },
      flightIncluded: { type: Boolean, default: false },
      visaIncluded: { type: Boolean, default: false },
      insuranceIncluded: { type: Boolean, default: false },
    },
    paymentPlan: [
      {
        label: { type: String, default: '' },
        percent: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    importantNotes: {
      cancellationPolicy: { type: String, default: '' },
      termsAndConditions: { type: String, default: '' },
      travelGuidelines: { type: String, default: '' },
      weather: { type: String, default: '' },
      packingTips: { type: String, default: '' },
    },
    analytics: {
      viewCount: { type: Number, default: 0 },
      viewedAt: { type: Date },
      acceptedAt: { type: Date },
      rejectedAt: { type: Date },
    },
    versions: [
      {
        versionNumber: { type: Number, required: true },
        label: { type: String, default: '' },
        savedAt: { type: Date, default: Date.now },
        savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        snapshot: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    pricing: {
      baseCost: { type: Number, default: 0 },
      hotelCost: { type: Number, default: 0 },
      cabCost: { type: Number, default: 0 },
      flightCost: { type: Number, default: 0 },
      activityCost: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      markup: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      coupon: { type: String, default: '' },
      gst: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      profitMargin: { type: Number, default: 0 },
    },
    costing: {
      lineItems: [{ type: mongoose.Schema.Types.Mixed }],
      subtotal: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      markup: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
      profitMargin: { type: Number, default: 0 },
    },
    selectedHotels: [{ type: mongoose.Schema.Types.Mixed }],
    selectedCabs: [{ type: mongoose.Schema.Types.Mixed }],
    selectedFlights: [{ type: mongoose.Schema.Types.Mixed }],
    selectedActivities: [{ type: mongoose.Schema.Types.Mixed }],
    customizations: { type: String, default: '' },
    createdByExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timeline: [timelineSchema],
    sentAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

quotationSchema.index({ lead: 1, status: 1 });
quotationSchema.index({ status: 1, createdAt: -1 });

quotationSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Quotation', quotationSchema);
module.exports.QUOTE_STATUSES = QUOTE_STATUSES;
