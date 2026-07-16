const mongoose = require('mongoose');

const websiteReviewSchema = new mongoose.Schema(
  {
    trekId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteTrek', required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, default: '' },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    enabled: { type: Boolean, default: true },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'website_reviews' },
);

websiteReviewSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteReview', websiteReviewSchema);
