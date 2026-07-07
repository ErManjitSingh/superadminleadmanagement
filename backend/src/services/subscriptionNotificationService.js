const Company = require('../superadmin/models/Company');
const PlatformNotification = require('../superadmin/models/PlatformNotification');
const { sendMailMessage, isEmailConfiguredFor } = require('./emailService');
const { brandName, platformDomain } = require('../config/branding');
const { workspaceUrl } = require('./upgradeRequestService');

const REMINDER_DAYS = [7, 3, 1];

function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date) - Date.now()) / (24 * 60 * 60 * 1000));
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function sendTrialReminderEmail(company, daysLeft) {
  if (!(await isEmailConfiguredFor(company._id))) {
    console.log(`[SubscriptionEmail] SMTP not configured for ${company.name} — skip ${daysLeft}d reminder`);
    return false;
  }

  const upgradeUrl = `${workspaceUrl(company)}/settings/subscription`;
  const subject = daysLeft <= 1
    ? `Your ${brandName} trial ends tomorrow`
    : `Your ${brandName} trial ends in ${daysLeft} days`;

  await sendMailMessage({
    companyId: company._id,
    to: company.ownerEmail,
    subject,
    html: `
      <p>Hi ${company.ownerName},</p>
      <p>Your <strong>${company.name}</strong> workspace trial ends on <strong>${formatDate(company.trialEndDate)}</strong>${daysLeft <= 1 ? ' (tomorrow)' : ` (in ${daysLeft} days)`}.</p>
      <p>To keep your CRM, leads, bookings and team access active, upgrade your plan before expiry.</p>
      <p><a href="${upgradeUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Upgrade Plan</a></p>
      <p style="color:#64748b;font-size:13px">Workspace: ${workspaceUrl(company)}</p>
    `,
    text: `Hi ${company.ownerName}, your trial ends on ${formatDate(company.trialEndDate)}. Upgrade: ${upgradeUrl}`,
  });

  return true;
}

async function sendTrialExpiredEmail(company) {
  if (!(await isEmailConfiguredFor(company._id))) {
    console.log(`[SubscriptionEmail] SMTP not configured — skip expired email for ${company.name}`);
    return false;
  }

  const upgradeUrl = `${workspaceUrl(company)}/settings/subscription`;
  await sendMailMessage({
    companyId: company._id,
    to: company.ownerEmail,
    subject: `Your ${brandName} trial has expired`,
    html: `
      <p>Hi ${company.ownerName},</p>
      <p>Your <strong>${company.name}</strong> trial on ${brandName} has expired. Your workspace is now read-only / locked until you upgrade.</p>
      <p><a href="${upgradeUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Upgrade & Reactivate</a></p>
      <p style="color:#64748b;font-size:13px">Questions? Reply to this email or contact platform support.</p>
    `,
    text: `Your trial has expired. Upgrade: ${upgradeUrl}`,
  });
  return true;
}

async function processTrialReminderEmails() {
  const now = new Date();
  const companies = await Company.find({
    deletedAt: null,
    status: 'trial',
    trialEndDate: { $gt: now },
  }).select('name ownerName ownerEmail subdomain trialEndDate billingNotices');

  const noticeKeys = { 7: 'trialReminder7dAt', 3: 'trialReminder3dAt', 1: 'trialReminder1dAt' };
  let sent = 0;

  for (const company of companies) {
    const daysLeft = daysUntil(company.trialEndDate);
    if (!REMINDER_DAYS.includes(daysLeft)) continue;

    const noticeKey = noticeKeys[daysLeft];
    if (company.billingNotices?.[noticeKey]) continue;

    try {
      const ok = await sendTrialReminderEmail(company, daysLeft);
      if (ok) {
        await Company.updateOne(
          { _id: company._id },
          { $set: { [`billingNotices.${noticeKey}`]: new Date() } },
        );
        sent += 1;

        await PlatformNotification.create({
          type: 'trial_expiring',
          title: `Trial reminder sent (${daysLeft}d)`,
          message: `${company.name} — trial ends ${formatDate(company.trialEndDate)}`,
          companyId: company._id,
          severity: daysLeft <= 1 ? 'critical' : 'warning',
          metadata: { daysLeft, trialEndDate: company.trialEndDate },
        });
      }
    } catch (err) {
      console.error(`[SubscriptionEmail] Reminder failed for ${company.name}:`, err.message);
    }
  }

  return { sent };
}

async function processTrialExpiredEmails(companies = []) {
  let sent = 0;
  for (const raw of companies) {
    const company = raw.billingNotices
      ? raw
      : await Company.findById(raw._id).select('name ownerName ownerEmail subdomain billingNotices');
    if (!company || company.billingNotices?.trialExpiredEmailAt) continue;

    try {
      const ok = await sendTrialExpiredEmail(company);
      if (ok) {
        company.billingNotices = company.billingNotices || {};
        company.billingNotices.trialExpiredEmailAt = new Date();
        await company.save();
        sent += 1;
      }
    } catch (err) {
      console.error(`[SubscriptionEmail] Expired email failed for ${company.name}:`, err.message);
    }
  }
  return { sent };
}

module.exports = {
  daysUntil,
  processTrialReminderEmails,
  processTrialExpiredEmails,
  sendTrialReminderEmail,
  sendTrialExpiredEmail,
};
