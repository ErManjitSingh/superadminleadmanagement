const mongoose = require('mongoose');

const FEATURE_KEYS = [
  'crm',
  'bookings',
  'packages',
  'hotels',
  'transport',
  'activities',
  'reports',
  'calendar',
  'whatsapp',
  'email',
  'api',
  'payments',
  'invoices',
];

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    monthlyPrice: { type: Number, required: true, min: 0, default: 0 },
    yearlyPrice: { type: Number, required: true, min: 0, default: 0 },
    userLimit: { type: Number, required: true, min: 1, default: 5 },
    branchLimit: { type: Number, required: true, min: 1, default: 1 },
    storageLimitGb: { type: Number, required: true, min: 1, default: 5 },
    leadLimit: { type: Number, min: 0, default: 1000 },
    bookingLimit: { type: Number, min: 0, default: 500 },
    trialDays: { type: Number, min: 0, default: 14 },
    whatsappLimit: { type: Number, min: 0, default: 0 },
    apiCallLimit: { type: Number, min: 0, default: 0 },
    customDomainLimit: { type: Number, min: 0, default: 1 },
    features: {
      type: [String],
      enum: FEATURE_KEYS,
      default: ['crm', 'bookings', 'packages'],
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    isCustom: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  },
  { timestamps: true, collection: 'subscription_plans' }
);

subscriptionPlanSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
module.exports.FEATURE_KEYS = FEATURE_KEYS;
