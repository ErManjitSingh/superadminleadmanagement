const WebsiteTrek = require('../models/WebsiteTrek');
const WebsiteDestination = require('../models/WebsiteDestination');
const WebsiteBlog = require('../models/WebsiteBlog');
const WebsiteLead = require('../models/WebsiteLead');
const WebsiteReview = require('../models/WebsiteReview');
const WebsiteSeoPage = require('../models/WebsiteSeoPage');
const WebsiteRedirect = require('../models/WebsiteRedirect');
const WebsiteAnalyticsDaily = require('../models/WebsiteAnalyticsDaily');
const asyncHandler = require('../../../utils/asyncHandler');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const getDashboard = asyncHandler(async (req, res) => {
  const today = startOfDay();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let analytics = await WebsiteAnalyticsDaily.findOne({ date: today }).lean();
  if (!analytics) {
    analytics = {
      date: today,
      visitors: 0,
      pageViews: 0,
      bookings: 0,
      revenue: 0,
      leads: 0,
      bounceRate: 0,
      coreWebVitals: { lcp: null, fid: null, cls: null },
      brokenLinks: 0,
      seoScore: 0,
    };
  }

  const [
    todaysLeads,
    pendingReviews,
    topTreks,
    topDestinations,
    popularBlogs,
    recentEnquiries,
    publishedTreks,
    draftTreks,
    seoPages,
    indexedPages,
    redirects404,
  ] = await Promise.all([
    WebsiteLead.countDocuments({ deletedAt: null, createdAt: { $gte: today, $lt: tomorrow } }),
    WebsiteReview.countDocuments({ deletedAt: null, status: 'pending' }),
    WebsiteTrek.find({ deletedAt: null, status: 'published' })
      .sort({ viewCount: -1, bookingCount: -1 })
      .limit(5)
      .select('title slug viewCount bookingCount featuredImage difficulty')
      .lean(),
    WebsiteDestination.find({ deletedAt: null, status: 'published' })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('title slug viewCount featuredImage')
      .lean(),
    WebsiteBlog.find({ deletedAt: null, status: 'published' })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('title slug viewCount featuredImage publishedAt')
      .lean(),
    WebsiteLead.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('type name email phone status trekTitle createdAt')
      .lean(),
    WebsiteTrek.countDocuments({ deletedAt: null, status: 'published' }),
    WebsiteTrek.countDocuments({ deletedAt: null, status: 'draft' }),
    WebsiteSeoPage.countDocuments(),
    WebsiteSeoPage.countDocuments({ googleIndexStatus: 'indexed' }),
    WebsiteRedirect.countDocuments({ deletedAt: null, is404Handler: true, enabled: true }),
  ]);

  const seoCoverage = seoPages > 0 ? Math.round((indexedPages / seoPages) * 100) : 0;
  const computedSeoScore = analytics.seoScore
    || Math.min(100, Math.round((seoCoverage * 0.5) + (publishedTreks > 0 ? 25 : 0) + (todaysLeads >= 0 ? 15 : 0) + 10));

  res.json({
    widgets: {
      todaysVisitors: analytics.visitors || 0,
      todaysLeads,
      bookings: analytics.bookings || 0,
      revenue: analytics.revenue || 0,
      pendingReviews,
      websiteHealth: {
        publishedTreks,
        draftTreks,
        maintenanceRisk: draftTreks > publishedTreks ? 'attention' : 'healthy',
      },
      seoScore: computedSeoScore,
      googleIndexStatus: {
        total: seoPages,
        indexed: indexedPages,
        coveragePercent: seoCoverage,
      },
      brokenLinks: analytics.brokenLinks || redirects404,
      coreWebVitals: analytics.coreWebVitals || { lcp: null, fid: null, cls: null },
    },
    topTreks: topTreks.map((t) => ({
      id: t._id,
      title: t.title,
      slug: t.slug,
      viewCount: t.viewCount,
      bookingCount: t.bookingCount,
      featuredImage: t.featuredImage,
      difficulty: t.difficulty,
    })),
    topDestinations: topDestinations.map((d) => ({
      id: d._id,
      title: d.title,
      slug: d.slug,
      viewCount: d.viewCount,
      featuredImage: d.featuredImage,
    })),
    popularBlogs: popularBlogs.map((b) => ({
      id: b._id,
      title: b.title,
      slug: b.slug,
      viewCount: b.viewCount,
      featuredImage: b.featuredImage,
      publishedAt: b.publishedAt,
    })),
    recentEnquiries: recentEnquiries.map((l) => ({
      id: l._id,
      type: l.type,
      name: l.name,
      email: l.email,
      phone: l.phone,
      status: l.status,
      trekTitle: l.trekTitle,
      createdAt: l.createdAt,
    })),
  });
});

const recordAnalytics = asyncHandler(async (req, res) => {
  const date = startOfDay(req.body.date ? new Date(req.body.date) : new Date());
  const update = {};
  for (const key of ['visitors', 'pageViews', 'bookings', 'revenue', 'leads', 'bounceRate', 'brokenLinks', 'seoScore']) {
    if (req.body[key] !== undefined) update[key] = Number(req.body[key]) || 0;
  }
  if (req.body.coreWebVitals) update.coreWebVitals = req.body.coreWebVitals;

  const doc = await WebsiteAnalyticsDaily.findOneAndUpdate(
    { date },
    { $set: update, $setOnInsert: { date } },
    { upsert: true, new: true },
  );

  res.json({ analytics: doc });
});

module.exports = { getDashboard, recordAnalytics };
