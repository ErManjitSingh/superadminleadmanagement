const Company = require('../superadmin/models/Company');
const SubscriptionPlan = require('../superadmin/models/SubscriptionPlan');
const PlatformSupportTicket = require('../superadmin/models/PlatformSupportTicket');
const PlatformNotification = require('../superadmin/models/PlatformNotification');
const PlatformAuditLog = require('../superadmin/models/PlatformAuditLog');
const { brandName, platformDomain } = require('../config/branding');
const ApiError = require('../utils/apiError');

const SUPERADMIN_APP_URL = process.env.SUPERADMIN_APP_URL || `https://admin.${platformDomain}`;

async function nextTicketNumber() {
  return `PLT-${Date.now().toString(36).toUpperCase()}`;
}

function workspaceUrl(company) {
  if (!company?.subdomain) return `https://${platformDomain}/app`;
  return `https://${company.subdomain}.${platformDomain}/app`;
}

async function hasOpenUpgradeTicket(companyId) {
  return PlatformSupportTicket.findOne({
    companyId,
    status: { $in: ['open', 'pending'] },
    subject: { $regex: /^\[Upgrade\]/i },
  }).lean();
}

async function createUpgradeRequest(company, user, { targetPlanSlug, message } = {}) {
  const existing = await hasOpenUpgradeTicket(company._id);
  if (existing) {
    return { ticket: existing, alreadyOpen: true };
  }

  let targetPlan = null;
  if (targetPlanSlug) {
    targetPlan = await SubscriptionPlan.findOne({
      slug: targetPlanSlug,
      deletedAt: null,
      status: 'active',
    }).lean();
  }

  const planLabel = targetPlan?.name || targetPlanSlug || 'Higher plan';
  const subject = `[Upgrade] ${company.name} — ${planLabel}`;
  const description = [
    `Company: ${company.name}`,
    `Owner: ${company.ownerName} (${company.ownerEmail})`,
    `Current status: ${company.status}`,
    `Requested by: ${user?.name || 'Admin'} (${user?.email || ''})`,
    `Target plan: ${planLabel}`,
    message ? `\nMessage:\n${message}` : '',
  ].filter(Boolean).join('\n');

  const ticket = await PlatformSupportTicket.create({
    ticketNumber: await nextTicketNumber(),
    companyId: company._id,
    companyName: company.name,
    contactEmail: company.ownerEmail,
    subject,
    description,
    priority: 'high',
    status: 'open',
  });

  await PlatformNotification.create({
    type: 'upgrade_request',
    title: 'Plan upgrade requested',
    message: `${company.name} requested upgrade to ${planLabel}`,
    companyId: company._id,
    severity: 'warning',
    metadata: {
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      targetPlanSlug: targetPlan?.slug || targetPlanSlug,
      requestedBy: user?.email,
    },
  });

  await PlatformAuditLog.create({
    actorType: 'system',
    action: 'upgrade_request',
    resourceType: 'company',
    resourceId: company._id,
    companyId: company._id,
    metadata: {
      companyName: company.name,
      targetPlan: planLabel,
      ticketNumber: ticket.ticketNumber,
      requestedBy: user?.email,
    },
  });

  return { ticket, alreadyOpen: false };
}

async function listAvailablePlans() {
  return SubscriptionPlan.find({
    deletedAt: null,
    status: 'active',
    slug: { $ne: 'custom' },
  })
    .sort({ sortOrder: 1 })
    .select('name slug description monthlyPrice yearlyPrice userLimit branchLimit storageLimitGb features')
    .lean();
}

module.exports = {
  SUPERADMIN_APP_URL,
  workspaceUrl,
  hasOpenUpgradeTicket,
  createUpgradeRequest,
  listAvailablePlans,
};
