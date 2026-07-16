const mongoose = require('mongoose');

const websiteTestimonialSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerImage: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    location: { type: String, default: '' },
    trekId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteTrek', default: null },
    content: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
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
  { timestamps: true, collection: 'website_testimonials' },
);

websiteTestimonialSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteTestimonial', websiteTestimonialSchema);
