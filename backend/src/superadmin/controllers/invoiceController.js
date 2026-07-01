const PlatformInvoice = require('../models/PlatformInvoice');
const Company = require('../models/Company');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

function formatInvoice(inv) {
  return {
    id: inv._id,
    invoiceNumber: inv.invoiceNumber,
    companyId: inv.companyId,
    companyName: inv.companyId?.name,
    amount: inv.amount,
    currency: inv.currency,
    billingCycle: inv.billingCycle,
    status: inv.status,
    dueDate: inv.dueDate,
    paidAt: inv.paidAt,
    periodStart: inv.periodStart,
    periodEnd: inv.periodEnd,
    createdAt: inv.createdAt,
  };
}

const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [invoices, total] = await Promise.all([
    PlatformInvoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('companyId', 'name ownerEmail')
      .lean(),
    PlatformInvoice.countDocuments(filter),
  ]);

  const rows = invoices.map((inv) => ({
    ...formatInvoice(inv),
    companyName: inv.companyId?.name,
    companyId: inv.companyId?._id || inv.companyId,
  }));

  res.json(paginatedResponse(rows, { page, limit, total }));
});

const generateInvoice = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.body.companyId, deletedAt: null })
    .populate('subscriptionPlanId')
    .lean();
  if (!company) throw new ApiError(404, 'Company not found');

  const plan = company.subscriptionPlanId;
  const billingCycle = req.body.billingCycle || company.billingCycle || 'monthly';
  const amount = billingCycle === 'yearly' ? plan?.yearlyPrice : plan?.monthlyPrice;

  const invoice = await PlatformInvoice.create({
    invoiceNumber: `INV-${Date.now()}`,
    companyId: company._id,
    planId: plan?._id,
    amount: amount || 0,
    currency: company.currency || 'INR',
    billingCycle,
    status: 'pending',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    periodStart: new Date(),
    periodEnd: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
  });

  res.status(201).json({ invoice: formatInvoice({ ...invoice.toObject(), companyId: company }) });
});

module.exports = { listInvoices, generateInvoice };
