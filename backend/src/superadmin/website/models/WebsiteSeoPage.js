const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoSchema');

const websiteSeoPageSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, unique: true, trim: true, index: true },
    pageType: {
      type: String,
      enum: ['static', 'trek', 'destination', 'blog', 'category', 'custom'],
      default: 'static',
    },
    path: { type: String, required: true, trim: true },
    title: { type: String, default: '' },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    googleIndexStatus: {
      type: String,
      enum: ['unknown', 'indexed', 'not_indexed', 'excluded', 'error'],
      default: 'unknown',
    },
    lastCrawledAt: { type: Date, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    ...seoFields,
  },
  { timestamps: true, collection: 'website_seo_pages' },
);

module.exports = mongoose.model('WebsiteSeoPage', websiteSeoPageSchema);
