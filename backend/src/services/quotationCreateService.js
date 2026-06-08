const Quotation = require('../models/Quotation');
const ApiError = require('../utils/apiError');
const { generateQuoteNumber, QUOTATION_POPULATE } = require('../utils/queryHelpers');
const { logActivity, getClientIp } = require('./activityService');
const { notifyQuotationCreated } = require('./notificationService');

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
  const quotation = await Quotation.create({
    quoteNumber: body.quoteNumber || generateQuoteNumber(),
    lead: lead._id,
    package: body.packageId || body.package,
    packageSnapshot: body.package,
    status,
    pricing: body.pricing,
    selectedHotels: body.selectedHotels || [],
    selectedCabs: body.selectedCabs || [],
    selectedFlights: body.selectedFlights || [],
    selectedActivities: body.selectedActivities || [],
    customizations: body.customizations,
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

  const populated = await Quotation.findById(quotation._id).populate(QUOTATION_POPULATE).lean();
  if (status === 'pending_approval') {
    notifyQuotationCreated(populated, lead, {
      approverIds: teamLeaderId ? [teamLeaderId] : [],
    }).catch(() => {});
  }

  return populated;
}

function assertCanCreateQuotation(req) {
  if (req.user.role === 'admin') {
    throw new ApiError(403, 'Admin can only view quotations');
  }
}

module.exports = { persistQuotation, assertCanCreateQuotation };
