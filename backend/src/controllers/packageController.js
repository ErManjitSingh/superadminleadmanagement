const Package = require('../models/Package');
const Hotel = require('../models/Hotel');
const Cab = require('../models/Cab');
const Flight = require('../models/Flight');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

function applySearch(items, search) {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
}

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function syncDurationFields(body = {}) {
  const next = { ...body };
  const days = Number(next.days || next.duration || 1);
  const nights = Number(next.nights || Math.max(0, days - 1));
  next.days = days;
  next.nights = nights;
  next.duration = days;
  if (!next.slug && next.name) next.slug = slugify(next.name);
  if (next.pricing?.finalPrice) {
    next.startingPrice = Number(next.pricing.finalPrice) || next.startingPrice || 0;
  }
  return next;
}

function packageSnapshot(pkg) {
  const lean = typeof pkg.toObject === 'function' ? pkg.toObject() : { ...pkg };
  const { versions, analytics, ...rest } = lean;
  return rest;
}

async function attachPackageStats(packages = []) {
  if (!packages.length) return packages;
  const ids = packages.map((p) => p._id);
  const [quotationCounts, bookingCounts] = await Promise.all([
    Quotation.aggregate([
      { $match: { package: { $in: ids } } },
      { $group: { _id: '$package', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { packageName: { $in: packages.map((p) => p.name).filter(Boolean) } } },
      { $group: { _id: '$packageName', count: { $sum: 1 } } },
    ]),
  ]);

  const qMap = Object.fromEntries(quotationCounts.map((r) => [String(r._id), r.count]));
  const bMap = Object.fromEntries(bookingCounts.map((r) => [r._id, r.count]));

  return packages.map((pkg) => {
    const quotationCount = qMap[String(pkg._id)] || pkg.analytics?.quotationCount || 0;
    const bookingCount = bMap[pkg.name] || pkg.analytics?.bookingCount || 0;
    const views = pkg.analytics?.views || 0;
    const popularityScore = quotationCount * 3 + bookingCount * 5 + views;
    return {
      ...pkg,
      quotationCount,
      bookingCount,
      views,
      popularityScore,
      createdByName: pkg.createdBy?.name || pkg.createdBy?.email || null,
    };
  });
}

const listPackages = asyncHandler(async (req, res) => {
  const { search, packageType, status } = req.query;
  const filter = {};
  if (packageType) filter.packageType = packageType;
  if (status) filter.status = status;

  let packages = await Package.find(filter)
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 })
    .lean();
  packages = applySearch(packages, search);
  packages = await attachPackageStats(packages);
  res.json(packages);
});

const getPackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id).populate('createdBy', 'name email').lean();
  if (!pkg) throw new ApiError(404, 'Package not found');
  const [withStats] = await attachPackageStats([pkg]);
  res.json(withStats);
});

const createPackage = asyncHandler(async (req, res) => {
  const body = syncDurationFields(req.body);
  const pkg = await Package.create({
    ...body,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  res.status(201).json(pkg);
});

const updatePackage = asyncHandler(async (req, res) => {
  const body = syncDurationFields(req.body);
  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    { ...body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!pkg) throw new ApiError(404, 'Package not found');
  res.json(pkg);
});

const deletePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  if (!pkg) throw new ApiError(404, 'Package not found');
  await pkg.deleteOne();
  res.json({ message: 'Package deleted' });
});

const duplicatePackage = asyncHandler(async (req, res) => {
  const original = await Package.findById(req.params.id).lean();
  if (!original) throw new ApiError(404, 'Package not found');

  const { _id, createdAt, updatedAt, analytics, versions, ...rest } = original;
  const copy = await Package.create({
    ...rest,
    name: `${original.name} (Copy)`,
    slug: slugify(`${original.name}-copy`),
    status: 'draft',
    source: 'duplicate',
    analytics: { views: 0, quotationCount: 0, bookingCount: 0, popularityScore: 0 },
    versions: [],
    itinerary: (original.itinerary || []).map((d) => ({ ...d })),
    destinations: (original.destinations || []).map((d) => ({ ...d })),
    hotels: (original.hotels || []).map((h) => ({ ...h })),
    transport: (original.transport || []).map((t) => ({ ...t })),
    activities: (original.activities || []).map((a) => ({ ...a })),
    meals: (original.meals || []).map((m) => ({ ...m })),
    gallery: [...(original.gallery || [])],
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  res.status(201).json(copy);
});

const archivePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    { status: 'archived', updatedBy: req.user._id },
    { new: true }
  );
  if (!pkg) throw new ApiError(404, 'Package not found');
  res.json(pkg);
});

const publishPackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  if (!pkg) throw new ApiError(404, 'Package not found');
  pkg.status = req.body.status || 'published';
  pkg.updatedBy = req.user._id;
  await pkg.save();
  res.json(pkg);
});

const savePackageVersion = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  if (!pkg) throw new ApiError(404, 'Package not found');
  const snapshot = packageSnapshot(pkg);
  pkg.versions = [
    { savedAt: new Date(), label: req.body.label || `Version ${(pkg.versions?.length || 0) + 1}`, snapshot },
    ...(pkg.versions || []),
  ].slice(0, 20);
  pkg.updatedBy = req.user._id;
  await pkg.save();
  res.json(pkg);
});

const restorePackageVersion = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  if (!pkg) throw new ApiError(404, 'Package not found');
  const version = (pkg.versions || []).find((v) => String(v._id) === String(req.params.versionId));
  if (!version?.snapshot) throw new ApiError(404, 'Version not found');
  Object.assign(pkg, version.snapshot);
  pkg.updatedBy = req.user._id;
  await pkg.save();
  res.json(pkg);
});

const incrementPackageViews = asyncHandler(async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'analytics.views': 1 } },
    { new: true }
  );
  if (!pkg) throw new ApiError(404, 'Package not found');
  res.json({ views: pkg.analytics?.views || 0 });
});

const listHotels = asyncHandler(async (req, res) => {
  const hotels = await Hotel.find().sort({ createdAt: -1 }).lean();
  res.json(applySearch(hotels, req.query.search));
});

const createHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.create(req.body);
  res.status(201).json(hotel);
});

const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!hotel) throw new ApiError(404, 'Hotel not found');
  res.json(hotel);
});

const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new ApiError(404, 'Hotel not found');
  await hotel.deleteOne();
  res.json({ message: 'Hotel deleted' });
});

const listCabs = asyncHandler(async (req, res) => {
  const cabs = await Cab.find().sort({ createdAt: -1 }).lean();
  res.json(applySearch(cabs, req.query.search));
});

const createCab = asyncHandler(async (req, res) => {
  const cab = await Cab.create(req.body);
  res.status(201).json(cab);
});

const updateCab = asyncHandler(async (req, res) => {
  const cab = await Cab.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cab) throw new ApiError(404, 'Cab not found');
  res.json(cab);
});

const deleteCab = asyncHandler(async (req, res) => {
  const cab = await Cab.findById(req.params.id);
  if (!cab) throw new ApiError(404, 'Cab not found');
  await cab.deleteOne();
  res.json({ message: 'Cab deleted' });
});

const listFlights = asyncHandler(async (req, res) => {
  const flights = await Flight.find().sort({ createdAt: -1 }).lean();
  res.json(applySearch(flights, req.query.search));
});

const createFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.create(req.body);
  res.status(201).json(flight);
});

const updateFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!flight) throw new ApiError(404, 'Flight not found');
  res.json(flight);
});

const deleteFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.findById(req.params.id);
  if (!flight) throw new ApiError(404, 'Flight not found');
  await flight.deleteOne();
  res.json({ message: 'Flight deleted' });
});

module.exports = {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  duplicatePackage,
  archivePackage,
  publishPackage,
  savePackageVersion,
  restorePackageVersion,
  incrementPackageViews,
  listHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  listCabs,
  createCab,
  updateCab,
  deleteCab,
  listFlights,
  createFlight,
  updateFlight,
  deleteFlight,
};
