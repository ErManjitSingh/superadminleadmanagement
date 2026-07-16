const WebsiteSeoPage = require('../models/WebsiteSeoPage');
const WebsiteTrek = require('../models/WebsiteTrek');
const WebsiteDestination = require('../models/WebsiteDestination');
const WebsiteBlog = require('../models/WebsiteBlog');
const asyncHandler = require('../../../utils/asyncHandler');
const ApiError = require('../../../utils/apiError');
const { parsePagination, paginatedResponse } = require('../../../utils/pagination');
const { pickSeo, SEO_KEYS } = require('../utils/seoSchema');
const { baseDoc, applyAllowed } = require('../utils/formatters');
const { logWebsiteActivity } = require('../services/websiteActivityService');

const DEFAULT_PAGES = [
  { pageKey: 'home', path: '/', title: 'Homepage', pageType: 'static' },
  { pageKey: 'treks', path: '/treks', title: 'Treks Listing', pageType: 'static' },
  { pageKey: 'destinations', path: '/destinations', title: 'Destinations', pageType: 'static' },
  { pageKey: 'blogs', path: '/blogs', title: 'Blogs', pageType: 'static' },
  { pageKey: 'contact', path: '/contact', title: 'Contact', pageType: 'static' },
  { pageKey: 'about', path: '/about', title: 'About', pageType: 'static' },
];

function formatSeo(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(p),
    pageKey: p.pageKey,
    pageType: p.pageType,
    path: p.path,
    title: p.title,
    resourceId: p.resourceId || null,
    googleIndexStatus: p.googleIndexStatus || 'unknown',
    lastCrawledAt: p.lastCrawledAt,
    ...pickSeo(p),
  };
}

async function ensureDefaults() {
  for (const page of DEFAULT_PAGES) {
    const exists = await WebsiteSeoPage.findOne({ pageKey: page.pageKey });
    if (!exists) await WebsiteSeoPage.create(page);
  }
}

const listSeoPages = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 });
  const filter = {};
  if (req.query.pageType) filter.pageType = req.query.pageType;
  if (req.query.q) {
    const regex = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { path: regex }, { pageKey: regex }, { seoTitle: regex }];
  }

  const [items, total] = await Promise.all([
    WebsiteSeoPage.find(filter).sort({ pageType: 1, path: 1 }).skip(skip).limit(limit).lean(),
    WebsiteSeoPage.countDocuments(filter),
  ]);

  res.json(paginatedResponse(items.map(formatSeo), { page, limit, total }));
});

const getSeoPage = asyncHandler(async (req, res) => {
  const item = await WebsiteSeoPage.findOne({
    $or: [{ _id: req.params.id }, { pageKey: req.params.id }],
  }).lean();
  if (!item) throw new ApiError(404, 'SEO page not found');
  res.json({ seoPage: formatSeo(item) });
});

const upsertSeoPage = asyncHandler(async (req, res) => {
  const pageKey = req.body.pageKey || req.params.id;
  if (!pageKey) throw new ApiError(400, 'pageKey required');

  let item = await WebsiteSeoPage.findOne({
    $or: [{ pageKey }, { _id: req.params.id }],
  });

  if (!item) {
    item = new WebsiteSeoPage({
      pageKey,
      path: req.body.path || `/${pageKey}`,
      title: req.body.title || pageKey,
      pageType: req.body.pageType || 'custom',
    });
  }

  applyAllowed(item, req.body, [
    'path', 'title', 'pageType', 'resourceId', 'googleIndexStatus', 'lastCrawledAt',
    ...SEO_KEYS,
  ]);
  item.updatedBy = req.superAdmin?._id;
  await item.save();

  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'updated',
    resourceType: 'seo_page',
    resourceId: item._id,
    title: item.title || item.pageKey,
    req,
  });

  res.json({ seoPage: formatSeo(item) });
});

const syncFromContent = asyncHandler(async (req, res) => {
  const [treks, destinations, blogs] = await Promise.all([
    WebsiteTrek.find({ deletedAt: null, status: 'published' }).select('title slug').lean(),
    WebsiteDestination.find({ deletedAt: null, status: 'published' }).select('title slug').lean(),
    WebsiteBlog.find({ deletedAt: null, status: 'published' }).select('title slug').lean(),
  ]);

  let upserted = 0;
  for (const trek of treks) {
    await WebsiteSeoPage.findOneAndUpdate(
      { pageKey: `trek:${trek.slug}` },
      {
        pageKey: `trek:${trek.slug}`,
        pageType: 'trek',
        path: `/treks/${trek.slug}`,
        title: trek.title,
        resourceId: trek._id,
      },
      { upsert: true },
    );
    upserted += 1;
  }
  for (const dest of destinations) {
    await WebsiteSeoPage.findOneAndUpdate(
      { pageKey: `destination:${dest.slug}` },
      {
        pageKey: `destination:${dest.slug}`,
        pageType: 'destination',
        path: `/destinations/${dest.slug}`,
        title: dest.title,
        resourceId: dest._id,
      },
      { upsert: true },
    );
    upserted += 1;
  }
  for (const blog of blogs) {
    await WebsiteSeoPage.findOneAndUpdate(
      { pageKey: `blog:${blog.slug}` },
      {
        pageKey: `blog:${blog.slug}`,
        pageType: 'blog',
        path: `/blogs/${blog.slug}`,
        title: blog.title,
        resourceId: blog._id,
      },
      { upsert: true },
    );
    upserted += 1;
  }

  res.json({ message: 'Synced', upserted });
});

const deleteSeoPage = asyncHandler(async (req, res) => {
  const item = await WebsiteSeoPage.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'SEO page not found');
  res.json({ message: 'Deleted' });
});

module.exports = {
  listSeoPages,
  getSeoPage,
  upsertSeoPage,
  syncFromContent,
  deleteSeoPage,
  formatSeo,
};
