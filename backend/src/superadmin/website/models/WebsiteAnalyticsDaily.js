const mongoose = require('mongoose');

const websiteAnalyticsDailySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true, index: true },
    visitors: { type: Number, default: 0 },
    pageViews: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    coreWebVitals: {
      lcp: { type: Number, default: null },
      fid: { type: Number, default: null },
      cls: { type: Number, default: null },
    },
    brokenLinks: { type: Number, default: 0 },
    seoScore: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'website_analytics_daily' },
);

module.exports = mongoose.model('WebsiteAnalyticsDaily', websiteAnalyticsDailySchema);
