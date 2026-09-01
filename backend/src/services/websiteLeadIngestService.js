const crypto = require('crypto');
const Company = require('../superadmin/models/Company');
const User = require('../models/User');
const Lead = require('../models/Lead');
const ApiError = require('../utils/apiError');
const { runWithTenantContext } = require('../utils/tenantContextStore');
const { normalizeLeadInput, computeLeadScoreByBudget } = require('../utils/normalizeLeadInput');
const { detectLeadType } = require('./leadTypeDetectionService');
const { assertLeadLimit } = require('./subscriptionLimitsService');
const { applyLeadMetrics } = require('./leadScoringService');
const { logLeadActivity } = require('./leadActivityService');
const { logAudit } = require('./leadAuditService');
const { getClientIp } = require('./activityService');
const { notifyLeadCreated } = require('./notificationService');
const { invalidate: invalidateDashboardCache } = require('./dashboardCacheService');
const { markOnboardingStep } = require('./onboardingService');
const { LEAD_POPULATE, enrichLead } = require('../utils/queryHelpers');

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function normalizePhone(value) {
  return String(value || '')
    .replace(/[^\d+]/g, '')
    .trim();
}

function pickApiKey(req) {
  return (
    req.headers['x-lead-key'] ||
    req.headers['x-api-key'] ||
    req.body?.apiKey ||
    req.body?.leadKey ||
    ''
  ).trim();
}

async function resolveCompanyForIngest(apiKey) {
  if (!apiKey) throw new ApiError(401, 'Lead API key is required');

  const envKey = (process.env.WEBSITE_LEAD_API_KEY || '').trim();
  const envSlug = (process.env.WEBSITE_LEAD_COMPANY_SLUG || '').trim().toLowerCase();
  const envCompanyId = (process.env.WEBSITE_LEAD_COMPANY_ID || '').trim();

  if (envKey && timingSafeEqualString(apiKey, envKey)) {
    const filter = { deletedAt: null };
    if (envCompanyId) filter._id = envCompanyId;
    else if (envSlug) filter.slug = envSlug;
    else throw new ApiError(500, 'WEBSITE_LEAD_COMPANY_SLUG or WEBSITE_LEAD_COMPANY_ID is not configured');

    const company = await Company.findOne(filter).lean();
    if (!company) throw new ApiError(404, 'Lead ingest company not found');
    return {
      company,
      sourceLabel: process.env.WEBSITE_LEAD_SOURCE_LABEL || 'Website Form',
    };
  }

  const company = await Company.findOne({
    deletedAt: null,
    'websiteLeadIngest.enabled': true,
    'websiteLeadIngest.apiKey': apiKey,
  })
    .select('+websiteLeadIngest.apiKey')
    .lean();

  if (!company || !timingSafeEqualString(company.websiteLeadIngest?.apiKey, apiKey)) {
    throw new ApiError(401, 'Invalid lead API key');
  }

  return {
    company,
    sourceLabel: company.websiteLeadIngest?.sourceLabel || 'Website Form',
  };
}

async function resolveCreatedBy(company) {
  if (company.adminUserId) {
    const admin = await User.findOne({
      _id: company.adminUserId,
      companyId: company._id,
      status: 'active',
    })
      .select('_id name role')
      .lean();
    if (admin) return admin;
  }

  const fallback = await User.findOne({
    companyId: company._id,
    status: 'active',
    role: { $in: ['admin', 'sales_manager'] },
  })
    .sort({ role: 1, createdAt: 1 })
    .select('_id name role')
    .lean();

  if (!fallback) {
    throw new ApiError(500, 'No active CRM admin found to own website leads');
  }
  return fallback;
}

function assertOriginAllowed(req, company) {
  const origin = req.headers.origin || '';
  if (!origin) return; // server-to-server (form.php) has no Origin

  const allowedFromCompany = company.websiteLeadIngest?.allowedOrigins || [];
  const allowedFromEnv = (process.env.WEBSITE_LEAD_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowed = [...allowedFromCompany, ...allowedFromEnv];
  if (!allowed.length) return;
  if (!allowed.includes(origin)) {
    throw new ApiError(403, 'Origin is not allowed for website lead ingest');
  }
}

/**
 * Create a CRM lead from an external website form (no JWT).
 * Accepts cab-site fields: name, no/phone, destination.
 */
async function ingestWebsiteLead(req) {
  const apiKey = pickApiKey(req);
  const { company, sourceLabel } = await resolveCompanyForIngest(apiKey);
  assertOriginAllowed(req, company);

  const body = req.body || {};
  const phone = normalizePhone(body.phone || body.no || body.contact || body.mobile);
  const name = String(body.name || '').trim();
  const destination = String(body.destination || body.packageName || body.package || '').trim() || 'Not specified';

  if (!name || !phone) {
    throw new ApiError(400, 'Name and phone are required');
  }
  if (phone.replace(/\D/g, '').length < 10) {
    throw new ApiError(400, 'Enter a valid phone number');
  }

  const packageHint = body.packageName || body.packageId || body.package || '';
  const message = String(body.message || body.notes || '').trim();
  const notesParts = [
    message,
    packageHint ? `Package: ${packageHint}` : '',
    body.sourcePage ? `Page: ${body.sourcePage}` : '',
  ].filter(Boolean);

  const payload = {
    name,
    phone,
    whatsapp: phone,
    email: body.email,
    destination,
    budget: Number(body.budget) > 0 ? Number(body.budget) : 0,
    source: 'website',
    leadSource: 'website',
    sourceLabel: body.sourceLabel || sourceLabel,
    channel: 'website',
    priority: 'medium',
    specialRequirements: notesParts.join('\n'),
    notes: notesParts.join('\n'),
    status: 'new',
  };

  const createdBy = await resolveCreatedBy(company);
  const companyId = company._id;

  return runWithTenantContext({ companyId, branchId: null, userId: createdBy._id }, async () => {
    await assertLeadLimit(companyId);

    const data = normalizeLeadInput(payload);
    data.destination = data.destination || 'Not specified';
    data.budget = Number(data.budget) || 0;
    data.budgetRange = data.budget > 0 ? data.budgetRange : 'custom';
    data.leadScore = computeLeadScoreByBudget(data.budget);
    data.status = 'new';
    data.createdBy = createdBy._id;
    data.companyId = companyId;
    data.branchId = null;
    data.channel = 'website';
    data.sourceLabel = payload.sourceLabel;

    const typeDetection = detectLeadType({ ...payload, ...data });
    data.leadType = typeDetection.leadType;
    data.leadTypeSource = typeDetection.leadTypeSource;

    await applyLeadMetrics(data);

    let lead;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        delete data.leadId;
        lead = await Lead.create(data);
        break;
      } catch (err) {
        if (attempt < 5 && (err.code === 11000 || err.code === 11001) && /leadId/i.test(err.message || '')) {
          continue;
        }
        throw err;
      }
    }

    await markOnboardingStep(companyId, 'firstLeadAdded', true).catch(() => {});

    await logLeadActivity({
      leadId: lead._id,
      branchId: lead.branchId,
      type: 'lead_created',
      description: `Lead created from website (${data.sourceLabel || 'Website'})`,
      actor: createdBy,
      meta: { source: 'website', ingest: true },
    });
    await logAudit({
      entityType: 'lead',
      entityId: lead._id,
      branchId: lead.branchId,
      action: 'lead.created',
      actor: createdBy,
      ip: getClientIp(req),
    });

    const populated = await Lead.findById(lead._id).populate(LEAD_POPULATE).lean();
    const enriched = enrichLead(populated);
    invalidateDashboardCache('admin');
    notifyLeadCreated(enriched, createdBy).catch(() => {});

    return {
      ok: true,
      lead: {
        id: lead._id,
        leadId: lead.leadId,
        status: lead.status,
      },
    };
  });
}

module.exports = {
  ingestWebsiteLead,
  resolveCompanyForIngest,
};
