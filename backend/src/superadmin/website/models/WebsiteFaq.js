const mongoose = require('mongoose');

const websiteFaqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'general', index: true },
    trekId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteTrek', default: null },
    sortOrder: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    enabled: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'website_faqs' },
);

websiteFaqSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteFaq', websiteFaqSchema);
