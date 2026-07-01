const Company = require('../models/Company');
const PlatformInvoice = require('../models/PlatformInvoice');
const PlatformSupportTicket = require('../models/PlatformSupportTicket');
const asyncHandler = require('../../utils/asyncHandler');

const getReports = asyncHandler(async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    statusBreakdown,
    planDistribution,
    signupsByMonth,
    revenueByMonth,
    openTickets,
    paidInvoices,
  ] = await Promise.all([
    Company.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Company.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$subscriptionPlanId', count: { $sum: 1 } } },
    ]),
    Company.aggregate([
      { $match: { deletedAt: null, createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    PlatformInvoice.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    PlatformSupportTicket.countDocuments({ status: { $in: ['open', 'pending'] } }),
    PlatformInvoice.countDocuments({ status: 'paid' }),
  ]);

  res.json({
    statusBreakdown: statusBreakdown.map((s) => ({ status: s._id, count: s.count })),
    planDistribution,
    signupsByMonth: signupsByMonth.map((s) => ({ month: s._id, count: s.count })),
    revenueThisMonth: revenueByMonth[0]?.total || 0,
    openSupportTickets: openTickets,
    paidInvoicesCount: paidInvoices,
  });
});

const getBackups = asyncHandler(async (req, res) => {
  res.json({
    data: [
      {
        id: 'daily-auto',
        name: 'Daily MongoDB Backup',
        schedule: '0 2 * * *',
        lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: 'healthy',
        sizeGb: 2.4,
      },
    ],
    message: 'Backup monitoring — configure SERVER_IP backup agent for production',
  });
});

module.exports = { getReports, getBackups };
