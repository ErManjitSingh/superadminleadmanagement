const mongoose = require('mongoose');

const websiteCouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    discountValue: { type: Number, required: true, min: 0 },
    minAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    applicableTrekIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteTrek' }],
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['draft', 'active', 'expired', 'disabled'],
      default: 'active',
      index: true,
    },
    enabled: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'website_coupons' },
);

websiteCouponSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteCoupon', websiteCouponSchema);
