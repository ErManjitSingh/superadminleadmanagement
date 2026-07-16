const WebsiteReview = require('../models/WebsiteReview');
const WebsiteTrek = require('../models/WebsiteTrek');
const asyncHandler = require('../../../utils/asyncHandler');
const ApiError = require('../../../utils/apiError');
const { parsePagination, paginatedResponse } = require('../../../utils/pagination');
const { baseDoc } = require('../utils/formatters');

function formatReview(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(p),
    trekId: p.trekId,
    customerName: p.customerName,
    customerEmail: p.customerEmail || '',
    rating: p.rating,
    title: p.title || '',
    content: p.content,
    status: p.status,
    enabled: p.enabled !== false,
  };
}

async function refreshTrekRating(trekId) {
  const stats = await WebsiteReview.aggregate([
    { $match: { trekId, deletedAt: null, status: 'approved' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;
  await WebsiteTrek.updateOne(
    { _id: trekId },
    { $set: { ratingAvg: Math.round(avg * 10) / 10, ratingCount: count } },
  );
}

const listReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 25, maxLimit: 100 });
  const filter = { deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.trekId) filter.trekId = req.query.trekId;

  const [items, total] = await Promise.all([
    WebsiteReview.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WebsiteReview.countDocuments(filter),
  ]);

  res.json(paginatedResponse(items.map(formatReview), { page, limit, total }));
});

const moderateReview = asyncHandler(async (req, res) => {
  const item = await WebsiteReview.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Review not found');
  if (!['approved', 'rejected', 'pending'].includes(req.body.status)) {
    throw new ApiError(400, 'Invalid status');
  }
  item.status = req.body.status;
  item.moderatedBy = req.superAdmin?._id;
  await item.save();
  await refreshTrekRating(item.trekId);
  res.json({ review: formatReview(item) });
});

const deleteReview = asyncHandler(async (req, res) => {
  const item = await WebsiteReview.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Review not found');
  item.deletedAt = new Date();
  await item.save();
  await refreshTrekRating(item.trekId);
  res.json({ message: 'Deleted' });
});

module.exports = { listReviews, moderateReview, deleteReview, formatReview, refreshTrekRating };
