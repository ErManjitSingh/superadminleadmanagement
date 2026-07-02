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
  const quotation = await Quotation.findById(req.params.id).populate(QUOTATION_POPULATE).lean();
  if (!quotation) throw new ApiError(404, 'Quotation not found');
  res.json(quotation);
});

const createQuotation = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.body.leadId || req.body.lead);
  if (!lead) throw new ApiError(404, 'Lead not found');

  let pkg = null;
  if (req.body.packageId) {
    pkg = await Package.findById(req.body.packageId).lean();
  }

  const computedPayload = buildComputedPricingPayload({
    body: req.body,
    packageSnapshot: pkg || req.body.package,
  });

  const quotation = await Quotation.create({
    quoteNumber: req.body.quoteNumber || generateQuoteNumber(),
    branchId: req.branchId || lead.branchId,
    lead: lead._id,
    package: resolvePackageReference(req.body.packageId),
    packageSnapshot: req.body.package || pkg,
    status: req.body.status || 'draft',
    pricing: computedPayload.pricing,
    costing: computedPayload.costing,
    selectedHotels: computedPayload.selectedHotels,
    selectedCabs: computedPayload.selectedCabs,
    selectedFlights: computedPayload.selectedFlights,
    selectedActivities: computedPayload.selectedActivities,
    customizations: req.body.customizations,
    createdByExecutive:
      req.body.createdByExecutive ||
      (req.user.role === 'sales_executive' ? req.user._id : lead.assignedTo) ||
      undefined,
    teamLeader: req.body.teamLeader,
    shareToken: req.body.shareToken || crypto.randomBytes(16).toString('hex'),
    ...pickBuilderFields(req.body),
    timeline: req.body.timeline || [
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
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw new ApiError(404, 'Quotation not found');

  const packageSnapshot = req.body.package || quotation.packageSnapshot;
  const computedPayload = buildComputedPricingPayload({
    body: {
      ...quotation.toObject(),
      ...req.body,
    },
    packageSnapshot,
  });

  Object.assign(quotation, pickBuilderFields(req.body), req.body, computedPayload);
  if (!quotation.shareToken) {
    quotation.shareToken = crypto.randomBytes(16).toString('hex');
  }
  await quotation.save();

  const populated = await Quotation.findById(quotation._id).populate(QUOTATION_POPULATE).lean();
  res.json(populated);
});

const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw new ApiError(404, 'Quotation not found');
  await quotation.deleteOne();
  res.json({ message: 'Quotation deleted' });
});

const duplicateQuotation = asyncHandler(async (req, res) => {
  const original = await Quotation.findById(req.params.id).lean();
  if (!original) throw new ApiError(404, 'Quotation not found');

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
    quotation = await Quotation.findById(req.params.id);
    if (!quotation) throw new ApiError(404, 'Quotation not found');
  } else {
    const lead = await Lead.findById(req.body.leadId || req.body.lead);
    if (!lead) throw new ApiError(404, 'Lead not found');

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
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw new ApiError(404, 'Quotation not found');

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
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw new ApiError(404, 'Quotation not found');

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
  if (!pdfBase64) throw new ApiError('pdfBase64 is required', 400);

  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw new ApiError(404, 'Quotation not found');

  const buffer = Buffer.from(String(pdfBase64), 'base64');
  if (!buffer.length) throw new ApiError('Invalid PDF data', 400);
  if (buffer.length > 15 * 1024 * 1024) throw new ApiError('PDF too large (max 15MB)', 400);

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
