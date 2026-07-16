const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoSchema');

const websiteDestinationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    region: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    country: { type: String, default: 'India', trim: true },
    overview: { type: String, default: '' },
    travelGuide: { type: String, default: '' },
    gallery: [{ type: String }],
    featuredImage: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    weather: {
      summary: { type: String, default: '' },
      bestMonths: [{ type: String }],
      temperatureRange: { type: String, default: '' },
    },
    nearbyPlaces: [
      {
        name: { type: String },
        distance: { type: String },
        description: { type: String },
      },
    ],
    transport: {
      byAir: { type: String, default: '' },
      byRail: { type: String, default: '' },
      byRoad: { type: String, default: '' },
    },
    isFeatured: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date, default: null },
    enabled: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    deletedAt: { type: Date, default: null },
    ...seoFields,
  },
  { timestamps: true, collection: 'website_destinations' },
);

websiteDestinationSchema.index({ title: 'text', overview: 'text' });
websiteDestinationSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteDestination', websiteDestinationSchema);
