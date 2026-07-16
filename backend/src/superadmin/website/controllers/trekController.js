const WebsiteTrek = require('../models/WebsiteTrek');
const { createCrudController } = require('../services/crudFactory');
const { pickSeo } = require('../utils/seoSchema');
const { baseDoc } = require('../utils/formatters');
const asyncHandler = require('../../../utils/asyncHandler');
const ApiError = require('../../../utils/apiError');
const { uniqueSlug } = require('../utils/slugify');
const { logWebsiteActivity } = require('../services/websiteActivityService');

const ALLOWED = [
  'title', 'slug', 'location', 'region', 'state', 'duration', 'difficulty',
  'altitude', 'distance', 'overview', 'highlights', 'itinerary', 'gallery',
  'videos', 'featuredImage', 'bestTime', 'fitness', 'packingList', 'thingsToCarry',
  'inclusions', 'exclusions', 'departureDates', 'pricing', 'groupSize', 'faqs',
  'categoryIds', 'destinationId', 'relatedTrekIds', 'isFeatured', 'sortOrder',
  'status', 'scheduledAt', 'enabled',
];

function formatTrek(doc) {
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(plain),
    title: plain.title,
    slug: plain.slug,
    location: plain.location,
    region: plain.region,
    state: plain.state,
    duration: plain.duration,
    difficulty: plain.difficulty,
    altitude: plain.altitude,
    distance: plain.distance,
    overview: plain.overview,
    highlights: plain.highlights || [],
    itinerary: plain.itinerary || [],
    gallery: plain.gallery || [],
    videos: plain.videos || [],
    featuredImage: plain.featuredImage || '',
    bestTime: plain.bestTime || '',
    fitness: plain.fitness || '',
    packingList: plain.packingList || [],
    thingsToCarry: plain.thingsToCarry || [],
    inclusions: plain.inclusions || [],
    exclusions: plain.exclusions || [],
    departureDates: plain.departureDates || [],
    pricing: plain.pricing || {},
    groupSize: plain.groupSize || { min: 1, max: 20 },
    faqs: plain.faqs || [],
    categoryIds: plain.categoryIds || [],
    destinationId: plain.destinationId || null,
    relatedTrekIds: plain.relatedTrekIds || [],
    isFeatured: !!plain.isFeatured,
    sortOrder: plain.sortOrder || 0,
    status: plain.status,
    publishedAt: plain.publishedAt,
    scheduledAt: plain.scheduledAt,
    viewCount: plain.viewCount || 0,
    bookingCount: plain.bookingCount || 0,
    ratingAvg: plain.ratingAvg || 0,
    ratingCount: plain.ratingCount || 0,
    enabled: plain.enabled !== false,
    ...pickSeo(plain),
  };
}

const crud = createCrudController({
  Model: WebsiteTrek,
  resourceName: 'Trek',
  resourceType: 'trek',
  searchable: ['title', 'location', 'region', 'state'],
  allowedFields: ALLOWED,
  slugFrom: 'title',
  formatItem: formatTrek,
  supportsDuplicate: true,
  includeSeo: true,
});

const schedulePublish = asyncHandler(async (req, res) => {
  const item = await WebsiteTrek.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Trek not found');
  const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    throw new ApiError(400, 'Valid scheduledAt is required');
  }
  item.scheduledAt = scheduledAt;
  item.status = 'scheduled';
  item.updatedBy = req.superAdmin?._id;
  await item.save();
  res.json({ trek: formatTrek(item) });
});

const archive = asyncHandler(async (req, res) => {
  const item = await WebsiteTrek.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Trek not found');
  item.status = 'archived';
  item.updatedBy = req.superAdmin?._id;
  await item.save();
  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'archived',
    resourceType: 'trek',
    resourceId: item._id,
    title: item.title,
    req,
  });
  res.json({ trek: formatTrek(item) });
});

module.exports = {
  listTreks: crud.list,
  getTrek: crud.getOne,
  createTrek: crud.create,
  updateTrek: crud.update,
  deleteTrek: crud.remove,
  reorderTreks: crud.reorder,
  duplicateTrek: crud.duplicate,
  schedulePublishTrek: schedulePublish,
  archiveTrek: archive,
  formatTrek,
  uniqueSlug,
};
