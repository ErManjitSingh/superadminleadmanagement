const WebsiteTrek = require('../models/WebsiteTrek');
const WebsiteDestination = require('../models/WebsiteDestination');
const WebsiteCategory = require('../models/WebsiteCategory');
const WebsiteBlog = require('../models/WebsiteBlog');
const WebsiteHomepageSection = require('../models/WebsiteHomepageSection');
const WebsiteTestimonial = require('../models/WebsiteTestimonial');
const WebsiteFaq = require('../models/WebsiteFaq');
const WebsiteGallery = require('../models/WebsiteGallery');
const WebsiteMenu = require('../models/WebsiteMenu');
const WebsiteLead = require('../models/WebsiteLead');
const WebsiteSettings = require('../models/WebsiteSettings');
const WebsiteRedirect = require('../models/WebsiteRedirect');
const WebsiteSeoPage = require('../models/WebsiteSeoPage');
const WebsiteCoupon = require('../models/WebsiteCoupon');
const WebsiteReview = require('../models/WebsiteReview');
const WebsiteAnalyticsDaily = require('../models/WebsiteAnalyticsDaily');
const asyncHandler = require('../../../utils/asyncHandler');
const ApiError = require('../../../utils/apiError');
const { parsePagination, paginatedResponse } = require('../../../utils/pagination');
const { pickSeo } = require('../utils/seoSchema');
const { formatTrek } = require('./trekController');
const { formatDestination } = require('./destinationController');
const { formatCategory } = require('./categoryController');
const { formatBlog } = require('./blogController');
const { formatSection } = require('./homepageController');
const { sanitizeSettings, getOrCreate } = require('./settingsController');
const { refreshTrekRating } = require('./reviewController');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSectionLive(section) {
  if (!section.enabled || section.status === 'draft') return false;
  const now = Date.now();
  if (section.scheduledFrom && new Date(section.scheduledFrom).getTime() > now) return false;
  if (section.scheduledTo && new Date(section.scheduledTo).getTime() < now) return false;
  return true;
}

const getPublicHomepage = asyncHandler(async (req, res) => {
  const sections = await WebsiteHomepageSection.find({ status: { $in: ['published', 'scheduled'] } })
    .sort({ sortOrder: 1 })
    .lean();
  res.json({
    data: sections.filter(isSectionLive).map(formatSection),
  });
});

const listPublicTreks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 12, maxLimit: 50 });
  const filter = { deletedAt: null, status: 'published', enabled: true };
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.destinationId) filter.destinationId = req.query.destinationId;
  if (req.query.categoryId) filter.categoryIds = req.query.categoryId;
  if (req.query.q) {
    const regex = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { location: regex }, { region: regex }];
  }

  const [items, total] = await Promise.all([
    WebsiteTrek.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    WebsiteTrek.countDocuments(filter),
  ]);

  res.json(paginatedResponse(items.map(formatTrek), { page, limit, total }));
});

const getPublicTrek = asyncHandler(async (req, res) => {
  const item = await WebsiteTrek.findOne({
    deletedAt: null,
    status: 'published',
    enabled: true,
    $or: [{ slug: req.params.slug }, { _id: req.params.slug }],
  });
  if (!item) throw new ApiError(404, 'Trek not found');
  item.viewCount = (item.viewCount || 0) + 1;
  await item.save();
  res.json({ trek: formatTrek(item) });
});

const listPublicDestinations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 12, maxLimit: 50 });
  const filter = { deletedAt: null, status: 'published', enabled: true };
  if (req.query.featured === 'true') filter.isFeatured = true;
  const [items, total] = await Promise.all([
    WebsiteDestination.find(filter).sort({ sortOrder: 1 }).skip(skip).limit(limit).lean(),
    WebsiteDestination.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items.map(formatDestination), { page, limit, total }));
});

const getPublicDestination = asyncHandler(async (req, res) => {
  const item = await WebsiteDestination.findOne({
    deletedAt: null,
    status: 'published',
    enabled: true,
    $or: [{ slug: req.params.slug }, { _id: req.params.slug }],
  });
  if (!item) throw new ApiError(404, 'Destination not found');
  item.viewCount = (item.viewCount || 0) + 1;
  await item.save();
  res.json({ destination: formatDestination(item) });
});

const listPublicCategories = asyncHandler(async (req, res) => {
  const filter = { deletedAt: null, status: 'published', enabled: true };
  if (req.query.type) filter.type = req.query.type;
  const items = await WebsiteCategory.find(filter).sort({ sortOrder: 1 }).lean();
  res.json({ data: items.map(formatCategory) });
});

const listPublicBlogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 12, maxLimit: 50 });
  const filter = { deletedAt: null, status: 'published', enabled: true };
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.tag) filter.tags = req.query.tag;
  const [items, total] = await Promise.all([
    WebsiteBlog.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
    WebsiteBlog.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items.map((b) => formatBlog(b)), { page, limit, total }));
});

const getPublicBlog = asyncHandler(async (req, res) => {
  const item = await WebsiteBlog.findOne({
    deletedAt: null,
    status: 'published',
    enabled: true,
    $or: [{ slug: req.params.slug }, { _id: req.params.slug }],
  });
  if (!item) throw new ApiError(404, 'Blog not found');
  item.viewCount = (item.viewCount || 0) + 1;
  await item.save();
  res.json({ blog: formatBlog(item) });
});

const listPublicTestimonials = asyncHandler(async (req, res) => {
  const items = await WebsiteTestimonial.find({ deletedAt: null, status: 'published', enabled: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(50)
    .lean();
  res.json({
    data: items.map((p) => ({
      id: p._id,
      customerName: p.customerName,
      customerImage: p.customerImage,
      videoUrl: p.videoUrl,
      rating: p.rating,
      location: p.location,
      content: p.content,
      trekId: p.trekId,
    })),
  });
});

const listPublicFaqs = asyncHandler(async (req, res) => {
  const filter = { deletedAt: null, status: 'published', enabled: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.trekId) filter.trekId = req.query.trekId;
  const items = await WebsiteFaq.find(filter).sort({ sortOrder: 1 }).lean();
  res.json({
    data: items.map((p) => ({
      id: p._id,
      question: p.question,
      answer: p.answer,
      category: p.category,
    })),
  });
});

const listPublicGalleries = asyncHandler(async (req, res) => {
  const items = await WebsiteGallery.find({ deletedAt: null, status: 'published', enabled: true })
    .sort({ sortOrder: 1 })
    .lean();
  res.json({
    data: items.map((p) => ({
      id: p._id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      coverImage: p.coverImage,
      images: p.images,
    })),
  });
});

const getPublicMenus = asyncHandler(async (req, res) => {
  const filter = { enabled: true, status: 'published' };
  if (req.query.location) filter.location = req.query.location;
  const items = await WebsiteMenu.find(filter).lean();
  res.json({
    data: items.map((m) => ({
      id: m._id,
      name: m.name,
      location: m.location,
      items: (m.items || []).filter((i) => i.enabled !== false),
    })),
  });
});

const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  const safe = sanitizeSettings(settings);
  delete safe.smtp;
  res.json({ settings: safe });
});

const getPublicSeo = asyncHandler(async (req, res) => {
  const pathOrKey = req.query.path || req.query.pageKey || req.params.pageKey;
  if (!pathOrKey) throw new ApiError(400, 'path or pageKey required');
  const item = await WebsiteSeoPage.findOne({
    $or: [{ path: pathOrKey }, { pageKey: pathOrKey }],
  }).lean();
  if (!item) throw new ApiError(404, 'SEO not found');
  res.json({ seo: { path: item.path, pageKey: item.pageKey, title: item.title, ...pickSeo(item) } });
});

const resolveRedirect = asyncHandler(async (req, res) => {
  const fromPath = req.query.path || req.params.path;
  if (!fromPath) throw new ApiError(400, 'path required');
  const item = await WebsiteRedirect.findOne({ fromPath, deletedAt: null, enabled: true });
  if (!item) return res.json({ redirect: null });
  item.hitCount = (item.hitCount || 0) + 1;
  await item.save();
  res.json({
    redirect: {
      fromPath: item.fromPath,
      toPath: item.toPath,
      type: item.type,
    },
  });
});

const validateCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || req.query.code || '').toUpperCase().trim();
  if (!code) throw new ApiError(400, 'code required');
  const coupon = await WebsiteCoupon.findOne({ code, deletedAt: null, enabled: true, status: 'active' }).lean();
  if (!coupon) throw new ApiError(404, 'Invalid coupon');
  const now = Date.now();
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) throw new ApiError(400, 'Coupon not started');
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) throw new ApiError(400, 'Coupon expired');
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached');
  res.json({
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount,
      applicableTrekIds: coupon.applicableTrekIds,
    },
  });
});

const submitLead = asyncHandler(async (req, res) => {
  const type = req.body.type || 'contact';
  if (!['booking', 'contact', 'newsletter', 'callback'].includes(type)) {
    throw new ApiError(400, 'Invalid lead type');
  }
  if (type === 'newsletter' && !req.body.email) throw new ApiError(400, 'email required');
  if (type !== 'newsletter' && !req.body.name && !req.body.email && !req.body.phone) {
    throw new ApiError(400, 'name, email or phone required');
  }

  const lead = await WebsiteLead.create({
    type,
    name: req.body.name || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    message: req.body.message || '',
    trekId: req.body.trekId || null,
    trekTitle: req.body.trekTitle || '',
    destinationId: req.body.destinationId || null,
    preferredDate: req.body.preferredDate || null,
    travelers: req.body.travelers || 1,
    sourcePage: req.body.sourcePage || '',
    utmSource: req.body.utmSource || '',
    utmMedium: req.body.utmMedium || '',
    utmCampaign: req.body.utmCampaign || '',
    meta: req.body.meta || {},
  });

  const today = startOfDay();
  await WebsiteAnalyticsDaily.findOneAndUpdate(
    { date: today },
    { $inc: { leads: 1 }, $setOnInsert: { date: today } },
    { upsert: true },
  );

  res.status(201).json({
    lead: {
      id: lead._id,
      type: lead.type,
      status: lead.status,
      createdAt: lead.createdAt,
    },
  });
});

const submitReview = asyncHandler(async (req, res) => {
  if (!req.body.trekId || !req.body.customerName || !req.body.content || !req.body.rating) {
    throw new ApiError(400, 'trekId, customerName, rating and content are required');
  }
  const trek = await WebsiteTrek.findOne({ _id: req.body.trekId, deletedAt: null, status: 'published' });
  if (!trek) throw new ApiError(404, 'Trek not found');

  const review = await WebsiteReview.create({
    trekId: trek._id,
    customerName: req.body.customerName,
    customerEmail: req.body.customerEmail || '',
    rating: Number(req.body.rating),
    title: req.body.title || '',
    content: req.body.content,
    status: 'pending',
  });

  res.status(201).json({ review: { id: review._id, status: review.status } });
});

const trackVisit = asyncHandler(async (req, res) => {
  const today = startOfDay();
  const inc = { visitors: 1, pageViews: Number(req.body.pageViews) || 1 };
  await WebsiteAnalyticsDaily.findOneAndUpdate(
    { date: today },
    { $inc: inc, $setOnInsert: { date: today } },
    { upsert: true },
  );
  res.json({ ok: true });
});

const getSitemap = asyncHandler(async (req, res) => {
  const [treks, destinations, blogs, seoPages] = await Promise.all([
    WebsiteTrek.find({ deletedAt: null, status: 'published', enabled: true, noIndex: { $ne: true } })
      .select('slug updatedAt sitemapPriority changeFrequency')
      .lean(),
    WebsiteDestination.find({ deletedAt: null, status: 'published', enabled: true, noIndex: { $ne: true } })
      .select('slug updatedAt sitemapPriority changeFrequency')
      .lean(),
    WebsiteBlog.find({ deletedAt: null, status: 'published', enabled: true, noIndex: { $ne: true } })
      .select('slug updatedAt sitemapPriority changeFrequency')
      .lean(),
    WebsiteSeoPage.find({ noIndex: { $ne: true }, pageType: 'static' }).lean(),
  ]);

  res.json({
    urls: [
      ...seoPages.map((p) => ({
        loc: p.path,
        lastmod: p.updatedAt,
        priority: p.sitemapPriority,
        changefreq: p.changeFrequency,
      })),
      ...treks.map((t) => ({
        loc: `/treks/${t.slug}`,
        lastmod: t.updatedAt,
        priority: t.sitemapPriority ?? 0.8,
        changefreq: t.changeFrequency || 'weekly',
      })),
      ...destinations.map((d) => ({
        loc: `/destinations/${d.slug}`,
        lastmod: d.updatedAt,
        priority: d.sitemapPriority ?? 0.7,
        changefreq: d.changeFrequency || 'weekly',
      })),
      ...blogs.map((b) => ({
        loc: `/blogs/${b.slug}`,
        lastmod: b.updatedAt,
        priority: b.sitemapPriority ?? 0.6,
        changefreq: b.changeFrequency || 'weekly',
      })),
    ],
  });
});

module.exports = {
  getPublicHomepage,
  listPublicTreks,
  getPublicTrek,
  listPublicDestinations,
  getPublicDestination,
  listPublicCategories,
  listPublicBlogs,
  getPublicBlog,
  listPublicTestimonials,
  listPublicFaqs,
  listPublicGalleries,
  getPublicMenus,
  getPublicSettings,
  getPublicSeo,
  resolveRedirect,
  validateCoupon,
  submitLead,
  submitReview,
  trackVisit,
  getSitemap,
  refreshTrekRating,
};
