const Quotation = require('../models/Quotation');
const Lead = require('../models/Lead');
const Package = require('../models/Package');
const crypto = require('crypto');
const { QUOTATION_TEMPLATES } = require('../data/quotationTemplates');
const { resolvePackageReference } = require('../utils/packageRef');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { notifyQuotationCreated } = require('../services/notificationService');
const { QUOTATION_POPULATE, generateQuoteNumber } = require('../utils/queryHelpers');
const { findQuotationsPaginated } = require('../repositories/quotationRepository');
const { getQuotationStats } = require('../repositories/roleScopedRepository');
const { calculateQuotationPricing } = require('../services/quotationCostingService');
const { markOnboardingStep } = require('../services/onboardingService');
const { saveQuotationPdfBuffer, buildPublicPdfUrl } = require('../services/quotationPdfService');
const { tenantFilter, companyScopedIdFilter, assertTenantDocument } = require('../utils/tenantDocument');
const { assertStorageAvailable, recordStorageUsage } = require('../services/subscriptionLimitsService');
const {
  quotationOmitsHotels,
  stripHotelsFromPackageSnapshot,
  isNoHotelLabel,
  isNoHotelMealPlan,
} = require('../utils/noHotelUtils');

async function loadLead(req, id) {
  const lead = await Lead.findOne(tenantFilter({ _id: id }, req));
  assertTenantDocument(lead, req, 'Lead');
  return lead;
}

async function loadPackage(req, id) {
  if (!id) return null;
  const pkg = await Package.findOne(companyScopedIdFilter(id, req)).lean();
  assertTenantDocument(pkg, req, 'Package');
  return pkg;
}

async function loadQuotation(req, id, { lean = false, populate = null } = {}) {
  let query = Quotation.findOne(companyScopedIdFilter(id, req));
  if (populate) query = query.populate(populate);
  const doc = lean ? await query.lean() : await query;
  assertTenantDocument(doc, req, 'Quotation');
  return doc;
}

function applyNoHotelSanitization(body = {}, lead = null) {
  const info = { ...(body.packageInfo || {}) };
  const omit =
    isNoHotelLabel(lead?.hotelCategory)
    || isNoHotelLabel(info.hotelCategory)
    || isNoHotelMealPlan(info.mealPlan)
    || quotationOmitsHotels({ packageInfo: info, selectedHotels: body.selectedHotels, lead }, lead);

  if (!omit) return body;

  const cleaned = stripHotelsFromPackageSnapshot(body.package || body.packageSnapshot || {});
  return {
    ...body,
    selectedHotels: [],
    package: cleaned,
    packageSnapshot: cleaned,
    packageInfo: {
      ...info,
      mealPlan: info.mealPlan || 'No Hotel',
      hotelCategory: '',
    },
  };
}

function pickBuilderFields(body = {}) {
  const fields = {};
  const keys = [
    'packageInfo',
    'paymentPlan',
    'importantNotes',
    'templateKey',
    'customizations',
    'packageSnapshot',
    'package',
    'analytics',
  ];
  keys.forEach((key) => {
    if (body[key] !== undefined) fields[key] = body[key];
  });
  return fields;
}

function buildVersionSnapshot(quotation) {
  const obj = quotation.toObject ? quotation.toObject() : quotation;
  const {
    _id,
    quoteNumber,
    createdAt,
    updatedAt,
    versions,
    timeline,
    analytics,
    sentAt,
    ...snapshot
  } = obj;
  return snapshot;
}

function buildComputedPricingPayload({ body, packageSnapshot }) {
  const computed = calculateQuotationPricing({
    packageSnapshot: packageSnapshot || body.package || null,
    selectedHotels: body.selectedHotels || [],
    selectedCabs: body.selectedCabs || [],
    selectedFlights: body.selectedFlights || [],
    selectedActivities: body.selectedActivities || [],
    pricingInput: body.pricing || {},
  });

  return {
    pricing: computed.pricing,
    costing: computed.costing,
    selectedHotels: body.selectedHotels || [],
    selectedCabs: body.selectedCabs || [],
    selectedFlights: body.selectedFlights || [],
    selectedActivities: body.selectedActivities || [],
  };
}

const listQuotations = asyncHandler(async (req, res) => {
  const result = await findQuotationsPaginated(req.query, { branchId: req.branchId });
  res.json(result);
});

const getQuotationStatsHandler = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const stats = await getQuotationStats(filter);
  res.json(stats);
});

const getQuotation = asyncHandler(async (req, res) => {
  const quotation = await loadQuotation(req, req.params.id, { lean: true, populate: QUOTATION_POPULATE });
  res.json(quotation);
});

const createQuotation = asyncHandler(async (req, res) => {
  const lead = await loadLead(req, req.body.leadId || req.body.lead);

  const pkg = req.body.packageId ? await loadPackage(req, req.body.packageId) : null;
  const body = applyNoHotelSanitization(req.body, lead);

  const computedPayload = buildComputedPricingPayload({
    body,
    packageSnapshot: body.package || body.packageSnapshot || pkg,
  });

  const quotation = await Quotation.create({
    quoteNumber: body.quoteNumber || generateQuoteNumber(),
    branchId: req.branchId || lead.branchId,
    lead: lead._id,
    package: resolvePackageReference(body.packageId),
    packageSnapshot: body.package || body.packageSnapshot || pkg,
    status: body.status || 'draft',
    pricing: computedPayload.pricing,
    costing: computedPayload.costing,
    selectedHotels: computedPayload.selectedHotels,
    selectedCabs: computedPayload.selectedCabs,
    selectedFlights: computedPayload.selectedFlights,
    selectedActivities: computedPayload.selectedActivities,
    customizations: body.customizations,
    createdByExecutive:
      body.createdByExecutive ||
      (req.user.role === 'sales_executive' ? req.user._id : lead.assignedTo) ||
      undefined,
    teamLeader: body.teamLeader,
    shareToken: body.shareToken || crypto.randomBytes(16).toString('hex'),
    ...pickBuilderFields(body),
    timeline: body.timeline || [
      { type: 'created', date: new Date(), user: req.user.name, notes: 'Quote created' },
    ],
    createdBy: req.user._id,
  });

  if (req.companyId) {
    await markOnboardingStep(req.companyId, 'firstQuotationCreated', true).catch(() => {});
  }

  const populated = await Quotation.findById(quotation._id).populate(QUOTATION_POPULATE).lean();
  if (populated.status === 'pending_approval' || populated.status === 'sent') {
    notifyQuotationCreated(populated, lead).catch(() => {});
  }
  res.status(201).json(populated);
});

const updateQuotation = asyncHandler(async (req, res) => {
  const quotation = await loadQuotation(req, req.params.id);
  const lead = quotation.lead
    ? await Lead.findById(quotation.lead).select('hotelCategory').lean().catch(() => null)
    : null;

  const body = applyNoHotelSanitization(
    {
      ...(quotation.toObject?.() || {}),
      ...req.body,
      packageInfo: req.body.packageInfo || quotation.packageInfo,
      selectedHotels: req.body.selectedHotels !== undefined ? req.body.selectedHotels : quotation.selectedHotels,
      package: req.body.package || quotation.packageSnapshot,
    },
    lead,
  );

  const packageSnapshot = body.package || body.packageSnapshot || quotation.packageSnapshot;
  const computedPayload = buildComputedPricingPayload({
    body,
    packageSnapshot,
  });

  Object.assign(quotation, pickBuilderFields(body), body, computedPayload);
  if (body.packageSnapshot) quotation.packageSnapshot = body.packageSnapshot;
  if (body.selectedHotels) quotation.selectedHotels = body.selectedHotels;
  if (!quotation.shareToken) {
    quotation.shareToken = crypto.randomBytes(16).toString('hex');
  }
  await quotation.save();

  const populated = await Quotation.findById(quotation._id).populate(QUOTATION_POPULATE).lean();
  res.json(populated);
});

const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await loadQuotation(req, req.params.id);
  await quotation.deleteOne();
  res.json({ message: 'Quotation deleted' });
});

const duplicateQuotation = asyncHandler(async (req, res) => {
  const original = await loadQuotation(req, req.params.id, { lean: true });

  const { _id, quoteNumber, createdAt, updatedAt, approvedBy, sentAt, ...rest } = original;
  const copy = await Quotation.create({
    ...rest,
    quoteNumber: generateQuoteNumber(),
    status: 'draft',
    timeline: [
      ...(original.timeline || []),
      { type: 'duplicated', date: new Date(), user: req.user.name, notes: `Duplicated from ${original.quoteNumber}` },
    ],
    createdBy: req.user._id,
  });

  const populated = await Quotation.findById(copy._id).populate(QUOTATION_POPULATE).lean();
  res.status(201).json(populated);
});

const recalculateQuotation = asyncHandler(async (req, res) => {
  const computed = calculateQuotationPricing({
    packageSnapshot: req.body.package || null,
    selectedHotels: req.body.selectedHotels || [],
    selectedCabs: req.body.selectedCabs || [],
    selectedFlights: req.body.selectedFlights || [],
    selectedActivities: req.body.selectedActivities || [],
    pricingInput: req.body.pricing || {},
  });
  res.json(computed);
});

const getQuotationTemplates = asyncHandler(async (req, res) => {
  res.json(QUOTATION_TEMPLATES);
});

const autosaveQuotation = asyncHandler(async (req, res) => {
  let quotation;
  if (req.params.id) {
    quotation = await loadQuotation(req, req.params.id);
  } else {
    const lead = await loadLead(req, req.body.leadId || req.body.lead);

    quotation = await Quotation.create({
      quoteNumber: generateQuoteNumber(),
      branchId: req.branchId || lead.branchId,
      lead: lead._id,
      package: resolvePackageReference(req.body.packageId),
      status: 'draft',
      shareToken: crypto.randomBytes(16).toString('hex'),
      timeline: [{ type: 'created', date: new Date(), user: req.user.name, notes: 'Draft auto-saved' }],
      createdBy: req.user._id,
    });
  }

  const packageSnapshot = req.body.package || quotation.packageSnapshot;
  const computedPayload = buildComputedPricingPayload({
    body: { ...quotation.toObject(), ...req.body },
    packageSnapshot,
  });

  Object.assign(
    quotation,
    pickBuilderFields(req.body),
    {
      packageSnapshot: req.body.package || quotation.packageSnapshot,
      customizations: req.body.customizations ?? quotation.customizations,
      package: req.body.packageId ? resolvePackageReference(req.body.packageId) : quotation.package,
    },
    computedPayload
  );

  if (req.body.status && req.body.status !== quotation.status) {
    quotation.status = req.body.status;
    quotation.timeline = [
      ...(quotation.timeline || []),
      { type: req.body.status, date: new Date(), user: req.user.name, notes: 'Status updated via builder' },
    ];
  }

  if (!quotation.shareToken) {
    quotation.shareToken = crypto.randomBytes(16).toString('hex');
  }

  await quotation.save();
  const populated = await Quotation.findById(quotation._id).populate(QUOTATION_POPULATE).lean();
  res.json(populated);
});

const saveQuotationVersion = asyncHandler(async (req, res) => {
  const quotation = await loadQuotation(req, req.params.id);

  const versionNumber = (quotation.versions?.length || 0) + 1;
  const version = {
    versionNumber,
    label: req.body.label || `Version ${versionNumber}`,
    savedAt: new Date(),
    savedBy: req.user._id,
    snapshot: buildVersionSnapshot(quotation),
  };

  quotation.versions = [...(quotation.versions || []), version];
  quotation.timeline = [
    ...(quotation.timeline || []),
    { type: 'version_saved', date: new Date(), user: req.user.name, notes: version.label },
  ];
  await quotation.save();

  const populated = await Quotation.findById(quotation._id).populate(QUOTATION_POPULATE).lean();
  res.json(populated);
});

const restoreQuotationVersion = asyncHandler(async (req, res) => {
  const quotation = await loadQuotation(req, req.params.id);

  const version = (quotation.versions || []).find(
    (v) => String(v.versionNumber) === String(req.params.versionNumber)
  );
  if (!version?.snapshot) throw new ApiError(404, 'Version not found');

  const { snapshot } = version;
  const restoreFields = [
    'packageSnapshot',
    'packageInfo',
    'paymentPlan',
    'importantNotes',
    'templateKey',
    'customizations',
    'pricing',
    'costing',
    'selectedHotels',
    'selectedCabs',
    'selectedFlights',
    'selectedActivities',
  ];

  restoreFields.forEach((key) => {
    if (snapshot[key] !== undefined) quotation[key] = snapshot[key];
  });

  quotation.timeline = [
    ...(quotation.timeline || []),
    {
      type: 'version_restored',
      date: new Date(),
      user: req.user.name,
      notes: `Restored ${version.label || `version ${version.versionNumber}`}`,
    },
  ];
  await quotation.save();

  const populated = await Quotation.findById(quotation._id).populate(QUOTATION_POPULATE).lean();
  res.json(populated);
});

const uploadQuotationPdf = asyncHandler(async (req, res) => {
  const { pdfBase64 } = req.body || {};
  if (!pdfBase64) throw new ApiError(400, 'pdfBase64 is required');

  const quotation = await loadQuotation(req, req.params.id);

  const buffer = Buffer.from(String(pdfBase64), 'base64');
  if (!buffer.length) throw new ApiError(400, 'Invalid PDF data');
  if (buffer.length > 15 * 1024 * 1024) throw new ApiError(400, 'PDF too large (max 15MB)');

  await assertStorageAvailable(req.companyId, buffer.length);

  if (!quotation.shareToken) {
    quotation.shareToken = crypto.randomBytes(16).toString('hex');
  }

  const { pdfUrl } = saveQuotationPdfBuffer(quotation.shareToken, buffer);
  quotation.pdfUrl = pdfUrl;
  quotation.timeline = [
    ...(quotation.timeline || []),
    {
      type: 'pdf_generated',
      date: new Date(),
      user: req.user.name,
      notes: 'Quotation PDF generated for sharing',
    },
  ];
  await quotation.save();
  await recordStorageUsage(req.companyId, buffer.length);

  res.json({
    pdfUrl,
    publicUrl: buildPublicPdfUrl(req, pdfUrl),
    shareToken: quotation.shareToken,
  });
});

module.exports = {
  listQuotations,
  getQuotationStatsHandler,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  duplicateQuotation,
  recalculateQuotation,
  getQuotationTemplates,
  autosaveQuotation,
  saveQuotationVersion,
  restoreQuotationVersion,
  uploadQuotationPdf,
};
