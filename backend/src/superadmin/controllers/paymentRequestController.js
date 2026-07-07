const PlatformPaymentRequest = require('../models/PlatformPaymentRequest');
const PlatformNotification = require('../models/PlatformNotification');
const Company = require('../models/Company');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');
const { logPlatformAudit } = require('../services/platformAuditService');
const { computeExtendedRenewDate, applyPlanToCompany } = require('../services/subscriptionService');

const listPaymentRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    PlatformPaymentRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PlatformPaymentRequest.countDocuments(filter),
  ]);

  res.json(paginatedResponse(rows, { page, limit, total }));
});

const approvePaymentRequest = asyncHandler(async (req, res) => {
  const request = await PlatformPaymentRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Payment request not found');
  if (request.status !== 'submitted') throw new ApiError(400, 'Request already reviewed');

  const company = await Company.findOne({ _id: request.companyId, deletedAt: null });
  if (!company) throw new ApiError(404, 'Company not found');

  const billingCycle = request.billingCycle || company.billingCycle || 'monthly';

  // If the payment was for a specific plan, switch the company to it.
  if (request.planId) {
    const plan = await SubscriptionPlan.findOne({ _id: request.planId, deletedAt: null });
    if (plan) applyPlanToCompany(company, plan, { syncFeatures: true, billingCycle });
  }

  const periods = Math.max(1, Math.min(36, Number(req.body.periods) || 1));
  company.renewDate = computeExtendedRenewDate(company, billingCycle, periods);
  company.status = 'active';
  company.billingCycle = billingCycle;
  company.updatedBy = req.superAdmin._id;
  await company.save();

  request.status = 'approved';
  request.reviewedBy = req.superAdmin._id;
  request.reviewedAt = new Date();
  request.reviewNote = req.body.note || '';
  request.extendedUntil = company.renewDate;
  await request.save();

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'payment_approved',
    resourceType: 'company',
    resourceId: company._id,
    companyId: company._id,
    metadata: {
      requestId: request._id,
      amount: request.amount,
      reference: request.referenceNumber,
      renewDate: company.renewDate,
    },
    req,
  });

  res.json({ request: request.toObject(), renewDate: company.renewDate, status: company.status });
});

const rejectPaymentRequest = asyncHandler(async (req, res) => {
  const request = await PlatformPaymentRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Payment request not found');
  if (request.status !== 'submitted') throw new ApiError(400, 'Request already reviewed');

  request.status = 'rejected';
  request.reviewedBy = req.superAdmin._id;
  request.reviewedAt = new Date();
  request.reviewNote = req.body.note || '';
  await request.save();

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'payment_rejected',
    resourceType: 'company',
    resourceId: request.companyId,
    companyId: request.companyId,
    metadata: { requestId: request._id, note: request.reviewNote },
    req,
  });

  res.json({ request: request.toObject() });
});

// Called from the tenant CRM after a company admin pays via UPI and submits the
// transaction reference. Creates the request + a super-admin notification.
async function createPaymentRequestFromTenant({ company, user, plan, billingCycle, amount, upiId, referenceNumber, payerNote }) {
  const request = await PlatformPaymentRequest.create({
    companyId: company._id,
    companyName: company.name,
    planId: plan?._id,
    planName: plan?.name,
    billingCycle: billingCycle || company.billingCycle || 'monthly',
    amount,
    upiId,
    referenceNumber,
    payerNote,
    submittedByUserId: user?._id,
    submittedByEmail: user?.email,
    status: 'submitted',
  });

  await PlatformNotification.create({
    type: 'payment_received',
    title: 'Renewal payment submitted',
    message: `${company.name} submitted a ${request.currency} ${amount} payment${referenceNumber ? ` (ref ${referenceNumber})` : ''}. Review & approve to extend their plan.`,
    companyId: company._id,
    severity: 'warning',
    metadata: { requestId: request._id, amount, referenceNumber },
  });

  return request;
}

module.exports = {
  listPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  createPaymentRequestFromTenant,
};
