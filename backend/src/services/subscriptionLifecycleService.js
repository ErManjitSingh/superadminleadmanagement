const Company = require('../superadmin/models/Company');
const PlatformAuditLog = require('../superadmin/models/PlatformAuditLog');
const {
  processTrialReminderEmails,
  processTrialExpiredEmails,
} = require('./subscriptionNotificationService');

async function expireOverdueSubscriptions() {
  const now = new Date();
  const trialFilter = {
    deletedAt: null,
    status: 'trial',
    trialEndDate: { $lte: now },
  };

  const renewFilter = {
    deletedAt: null,
    status: { $in: ['active', 'trial'] },
    renewDate: { $lte: now },
    autoRenewal: false,
  };

  const [trialExpired, renewExpired] = await Promise.all([
    Company.find(trialFilter).select('_id name ownerEmail trialEndDate billingNotices subdomain ownerName').lean(),
    Company.find(renewFilter).select('_id name ownerEmail renewDate billingNotices subdomain ownerName').lean(),
  ]);

  const expiredIds = [...new Set([
    ...trialExpired.map((c) => String(c._id)),
    ...renewExpired.map((c) => String(c._id)),
  ])];

  if (!expiredIds.length) {
    return { trialExpired: 0, renewExpired: 0, total: 0 };
  }

  await Company.updateMany(
    { _id: { $in: expiredIds } },
    { $set: { status: 'expired' } },
  );

  const auditRows = [
    ...trialExpired.map((c) => ({
      action: 'subscription_trial_expired',
      resourceType: 'company',
      resourceId: c._id,
      companyId: c._id,
      metadata: { companyName: c.name, trialEndDate: c.trialEndDate },
    })),
    ...renewExpired.map((c) => ({
      action: 'subscription_renewal_expired',
      resourceType: 'company',
      resourceId: c._id,
      companyId: c._id,
      metadata: { companyName: c.name, renewDate: c.renewDate },
    })),
  ];

  if (auditRows.length) {
    await PlatformAuditLog.insertMany(auditRows.map((row) => ({
      ...row,
      actorType: 'system',
      createdAt: now,
    })));
  }

  let expiredEmails = { sent: 0 };
  if (trialExpired.length) {
    try {
      expiredEmails = await processTrialExpiredEmails(trialExpired);
    } catch (err) {
      console.error('[SubscriptionLifecycle] Expired emails failed:', err.message);
    }
  }

  return {
    trialExpired: trialExpired.length,
    renewExpired: renewExpired.length,
    total: expiredIds.length,
    expiredEmailsSent: expiredEmails.sent,
  };
}

function startSubscriptionLifecycleJob() {
  const INTERVAL_MS = 60 * 60 * 1000;

  const run = async () => {
    try {
      const [expiryResult, reminderResult] = await Promise.all([
        expireOverdueSubscriptions(),
        processTrialReminderEmails(),
      ]);
      if (expiryResult.total > 0) {
        console.log(`[SubscriptionLifecycle] Expired ${expiryResult.total} companies (trial: ${expiryResult.trialExpired}, renewal: ${expiryResult.renewExpired}, emails: ${expiryResult.expiredEmailsSent})`);
      }
      if (reminderResult.sent > 0) {
        console.log(`[SubscriptionLifecycle] Sent ${reminderResult.sent} trial reminder email(s)`);
      }
    } catch (err) {
      console.error('[SubscriptionLifecycle] Job failed:', err.message);
    }
  };

  run();
  setInterval(run, INTERVAL_MS);
  console.log('[SubscriptionLifecycle] Hourly expiry job started');
}

module.exports = { expireOverdueSubscriptions, startSubscriptionLifecycleJob };
