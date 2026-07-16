const mongoose = require('mongoose');

const homepageSectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'hero',
        'hero_video',
        'hero_images',
        'search',
        'statistics',
        'featured_treks',
        'featured_destinations',
        'categories',
        'testimonials',
        'gallery',
        'newsletter',
        'cta',
        'footer',
      ],
      index: true,
    },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    media: [{ type: String }],
    ctaLabel: { type: String, default: '' },
    ctaUrl: { type: String, default: '' },
    sortOrder: { type: Number, default: 0, index: true },
    enabled: { type: Boolean, default: true },
    scheduledFrom: { type: Date, default: null },
    scheduledTo: { type: Date, default: null },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'published',
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  },
  { timestamps: true, collection: 'website_homepage_sections' },
);

module.exports = mongoose.model('WebsiteHomepageSection', homepageSectionSchema);
