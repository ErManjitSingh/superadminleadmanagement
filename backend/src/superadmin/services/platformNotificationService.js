const Company = require('../models/Company');
const PlatformNotification = require('../models/PlatformNotification');

async function scanAndCreateAlerts() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expiringTrials = await Company.find({
    deletedAt: null,
    status: 'trial',
    trialEndDate: { $gte: now, $lte: in7Days },
  }).select('name trialEndDate');

  for (const company of expiringTrials) {
    const exists = await PlatformNotification.findOne({
      type: 'trial_expiring',
      companyId: company._id,
      read: false,
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    });
    if (exists) continue;

    await PlatformNotification.create({
      type: 'trial_expiring',
      title: 'Trial expiring soon',
      message: `${company.name} trial ends on ${company.trialEndDate.toLocaleDateString()}`,
      companyId: company._id,
      severity: 'warning',
      metadata: { trialEndDate: company.trialEndDate },
    });
  }

  const renewals = await Company.find({
    deletedAt: null,
    status: { $in: ['active', 'trial'] },
    renewDate: { $gte: now, $lte: in7Days },
  }).select('name renewDate');

  for (const company of renewals) {
    const exists = await PlatformNotification.findOne({
      type: 'renewal_due',
      companyId: company._id,
      read: false,
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    });
    if (exists) continue;

    await PlatformNotification.create({
      type: 'renewal_due',
      title: 'Renewal upcoming',
      message: `${company.name} renews on ${company.renewDate.toLocaleDateString()}`,
      companyId: company._id,
      severity: 'info',
      metadata: { renewDate: company.renewDate },
    });
  }
}

module.exports = { scanAndCreateAlerts };
