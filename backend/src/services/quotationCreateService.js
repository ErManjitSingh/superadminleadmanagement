const Quotation = require('../models/Quotation');
const ApiError = require('../utils/apiError');
const { generateQuoteNumber, QUOTATION_POPULATE } = require('../utils/queryHelpers');
const { logActivity, getClientIp } = require('./activityService');
const { logLeadActivity } = require('./leadActivityService');
const { notifyQuotationCreated } = require('./notificationService');
const { resolvePackageReference } = require('../utils/packageRef');
const {
  quotationOmitsHotels,
  stripHotelsFromPackageSnapshot,
  isNoHotelLabel,
  isNoHotelMealPlan,
} = require('../utils/noHotelUtils');

function sanitizeBuilderBody(body = {}, lead = null) {
  const info = { ...(body.packageInfo || {}) };
  const leadNoHotel = isNoHotelLabel(lead?.hotelCategory) || isNoHotelLabel(info.hotelCategory);
  const mealNoHotel = isNoHotelMealPlan(info.mealPlan);
  const omit = leadNoHotel || mealNoHotel || quotationOmitsHotels({ packageInfo: info, selectedHotels: body.selectedHotels, lead }, lead);

  if (!omit) {
    return {
      ...body,
      packageInfo: info,
      package: body.package,
      packageSnapshot: body.packageSnapshot || body.package,
      selectedHotels: body.selectedHotels || [],
    };
  }

  const cleanedPkg = stripHotelsFromPackageSnapshot(body.package || body.packageSnapshot || {});
  return {
    ...body,
    selectedHotels: [],
    package: cleanedPkg,
    packageSnapshot: cleanedPkg,
    packageInfo: {
      ...info,
      mealPlan: info.mealPlan || 'No Hotel',
      hotelCategory: '',
    },
  };
}

async function persistQuotation({
  req,
  lead,
  body,
  status,
  timeline,
  createdByExecutiveId,
  teamLeaderId,
  approvalNote,
}) {
  const sanitized = sanitizeBuilderBody(body, lead);
  const snapshot = sanitized.packageSnapshot || sanitized.package;

  const quotation = await Quotation.create({
    quoteNumber: sanitized.quoteNumber || body.quoteNumber || generateQuoteNumber(),
    lead: lead._id,
    package: resolvePackageReference(sanitized.packageId || body.packageId),
    packageSnapshot: snapshot,
    packageInfo: sanitized.packageInfo,
    status,
    pricing: sanitized.pricing || body.pricing,
    selectedHotels: sanitized.selectedHotels || [],
    selectedCabs: sanitized.selectedCabs || body.selectedCabs || [],
    selectedFlights: sanitized.selectedFlights || body.selectedFlights || [],
    selectedActivities: sanitized.selectedActivities || body.selectedActivities || [],
    customizations: sanitized.customizations || body.customizations,
    paymentPlan: sanitized.paymentPlan || body.paymentPlan,
    importantNotes: sanitized.importantNotes || body.importantNotes,
    templateKey: sanitized.templateKey || body.templateKey,
    createdByExecutive: createdByExecutiveId || lead.assignedTo || req.user._id,
    branchId: req.branchId || lead.branchId || req.user.branchId || null,
    teamLeader: teamLeaderId || body.teamLeader,
    timeline,
    createdBy: req.user._id,
  });

  if (status === 'pending_approval' && lead.status === 'new') {
    lead.status = 'quotation_sent';
    await lead.save();
  }

  await logActivity({
    type: 'quotation_created',
    user: req.user.name,
    userId: req.user._id,
    action: approvalNote || (status === 'draft' ? 'Saved quote draft' : 'Created quotation'),
    target: quotation.quoteNumber,
    ip: getClientIp(req),
    branchId: req.branchId || lead.branchId || req.user.branchId || null,
  });

  const branchId = req.branchId || lead.branchId || req.user.branchId || null;
  const quoteTotal =
    Number(quotation.pricing?.total) ||
    Number(quotation.costing?.grandTotal) ||
    Number(body.pricing?.total) ||
    0;
  const pkgName = body.package?.name || lead.destination || 'Package';
  const priceLabel = `₹${Number(quoteTotal).toLocaleString('en-IN')}`;
  await logLeadActivity({
    leadId: lead._id,
    branchId,
    type: 'quotation_created',
    description: `${quotation.quoteNumber} · ${pkgName} · ${priceLabel} · ${status.replace(/_/g, ' ')}`,
    actor: req.user,
    meta: {
      quotationId: quotation._id,
      quoteNumber: quotation.quoteNumber,
      status,
      amount: quoteTotal,
    },
  });

  if (status === 'pending_approval' && lead.status === 'quotation_sent') {
    await logLeadActivity({
      leadId: lead._id,
      branchId,
      type: 'quotation_sent',
      description: `${quotation.quoteNumber} sent to customer · ${pkgName} · ${priceLabel}`,
      actor: req.user,
      meta: {
        quotationId: quotation._id,
        quoteNumber: quotation.quoteNumber,
        amount: quoteTotal,
      },
    });
  }

  const populated = await Quotation.findById(quotation._id).populate(QUOTATION_POPULATE).lean();
  if (status === 'pending_approval') {
    notifyQuotationCreated(populated, lead, {
      approverIds: teamLeaderId ? [teamLeaderId] : [],
    }).catch(() => {});
  }

  return populated;
}

function assertCanCreateQuotation() {
  // All non-read-only roles with quotations.create permission may create quotes.
}

module.exports = { persistQuotation, assertCanCreateQuotation };
