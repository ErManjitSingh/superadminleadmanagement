const WebsiteHomepageSection = require('../models/WebsiteHomepageSection');
const asyncHandler = require('../../../utils/asyncHandler');
const ApiError = require('../../../utils/apiError');
const { baseDoc, applyAllowed } = require('../utils/formatters');
const { logWebsiteActivity } = require('../services/websiteActivityService');

const SECTION_KEYS = [
  'hero', 'hero_video', 'hero_images', 'search', 'statistics',
  'featured_treks', 'featured_destinations', 'categories',
  'testimonials', 'gallery', 'newsletter', 'cta', 'footer',
];

const DEFAULT_SECTIONS = SECTION_KEYS.map((key, index) => ({
  key,
  title: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  subtitle: '',
  content: {},
  media: [],
  ctaLabel: '',
  ctaUrl: '',
  sortOrder: index,
  enabled: true,
  status: 'published',
}));

function formatSection(doc) {
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(plain),
    key: plain.key,
    title: plain.title,
    subtitle: plain.subtitle,
    content: plain.content || {},
    media: plain.media || [],
    ctaLabel: plain.ctaLabel || '',
    ctaUrl: plain.ctaUrl || '',
    sortOrder: plain.sortOrder || 0,
    enabled: plain.enabled !== false,
    scheduledFrom: plain.scheduledFrom,
    scheduledTo: plain.scheduledTo,
    status: plain.status,
  };
}

const ensureDefaults = asyncHandler(async (req, res, next) => {
  const count = await WebsiteHomepageSection.countDocuments();
  if (count === 0) {
    await WebsiteHomepageSection.insertMany(DEFAULT_SECTIONS);
  }
  next();
});

const listSections = asyncHandler(async (req, res) => {
  const count = await WebsiteHomepageSection.countDocuments();
  if (count === 0) await WebsiteHomepageSection.insertMany(DEFAULT_SECTIONS);

  const items = await WebsiteHomepageSection.find().sort({ sortOrder: 1 }).lean();
  res.json({ data: items.map(formatSection) });
});

const getSection = asyncHandler(async (req, res) => {
  const item = await WebsiteHomepageSection.findOne({
    $or: [{ _id: req.params.id }, { key: req.params.id }],
  }).lean();
  if (!item) throw new ApiError(404, 'Section not found');
  res.json({ section: formatSection(item) });
});

const upsertSection = asyncHandler(async (req, res) => {
  let item = null;
  if (req.params.id && /^[a-f\d]{24}$/i.test(req.params.id)) {
    item = await WebsiteHomepageSection.findById(req.params.id);
  }

  const key = req.body.key || item?.key || req.params.id;
  if (!SECTION_KEYS.includes(key)) throw new ApiError(400, 'Invalid section key');

  if (!item) {
    item = await WebsiteHomepageSection.findOne({ key });
  }
  if (!item) {
    item = new WebsiteHomepageSection({ key, sortOrder: SECTION_KEYS.indexOf(key) });
  }

  applyAllowed(item, req.body, [
    'title', 'subtitle', 'content', 'media', 'ctaLabel', 'ctaUrl',
    'sortOrder', 'enabled', 'scheduledFrom', 'scheduledTo', 'status',
  ]);
  item.updatedBy = req.superAdmin?._id;
  await item.save();

  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'updated',
    resourceType: 'homepage_section',
    resourceId: item._id,
    title: item.title || item.key,
    req,
  });

  res.json({ section: formatSection(item) });
});

const deleteSection = asyncHandler(async (req, res) => {
  const item = await WebsiteHomepageSection.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Section not found');
  await item.deleteOne();
  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'deleted',
    resourceType: 'homepage_section',
    resourceId: item._id,
    title: item.title || item.key,
    req,
  });
  res.json({ message: 'Deleted' });
});

const reorderSections = asyncHandler(async (req, res) => {
  const orders = Array.isArray(req.body?.orders) ? req.body.orders : [];
  await Promise.all(
    orders.map(({ id, sortOrder }) =>
      WebsiteHomepageSection.updateOne({ _id: id }, { $set: { sortOrder: Number(sortOrder) || 0 } }),
    ),
  );
  res.json({ message: 'Sorted' });
});

module.exports = {
  ensureDefaults,
  listSections,
  getSection,
  upsertSection,
  deleteSection,
  reorderSections,
  SECTION_KEYS,
  formatSection,
};
