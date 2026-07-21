const FollowUp = require('../models/FollowUp');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { companyScopedIdFilter, assertTenantDocument } = require('../utils/tenantDocument');
const {
  FOLLOWUP_POPULATE,
  startOfDay,
} = require('../utils/queryHelpers');
const { createFollowUpForLead, updateFollowUpRecord } = require('../services/followUpService');
const { findFollowUpsPaginated } = require('../repositories/followUpRepository');
const {
  getAdminFollowUpSummary,
  getMissedFollowUpsPreview,
  getTeamFollowUpReport,
} = require('../services/followUpSummaryService');

async function syncMissedFollowUps(req) {
  const todayStart = startOfDay();
  await FollowUp.updateMany(
    {
      status: 'pending',
      scheduledAt: { $lt: todayStart },
      ...(req?.companyId ? { companyId: req.companyId } : {}),
    },
    { status: 'missed' }
  );
}

const listFollowUps = asyncHandler(async (req, res) => {
  await syncMissedFollowUps(req);
  const result = await findFollowUpsPaginated(req.query, { companyId: req.companyId });
  res.json(result);
});

const getFollowUpSummary = asyncHandler(async (req, res) => {
  await syncMissedFollowUps(req);
  const [summary, missedPreview, teamReport] = await Promise.all([
    getAdminFollowUpSummary(req.companyId),
    getMissedFollowUpsPreview({}, 8, req.companyId),
    getTeamFollowUpReport(req.branchId),
  ]);
  res.json({ ...summary, missedPreview, teamReport });
});

const getFollowUp = asyncHandler(async (req, res) => {
  const followup = await FollowUp.findOne(companyScopedIdFilter(req.params.id, req)).populate(FOLLOWUP_POPULATE).lean();
  assertTenantDocument(followup, req, 'Follow-up');
  res.json(followup);
});

const createFollowUp = asyncHandler(async (req, res) => {
  const populated = await createFollowUpForLead({
    body: req.body,
    user: req.user,
    leadFilter: req.companyId ? { companyId: req.companyId } : null,
  });
  res.status(201).json(populated);
});

const updateFollowUp = asyncHandler(async (req, res) => {
  const followup = await FollowUp.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(followup, req, 'Follow-up');

  const populated = await updateFollowUpRecord({ followup, body: req.body, user: req.user });
  res.json(populated);
});

const deleteFollowUp = asyncHandler(async (req, res) => {
  const followup = await FollowUp.findOne(companyScopedIdFilter(req.params.id, req));
  assertTenantDocument(followup, req, 'Follow-up');
  const leadId = followup.lead;
  await followup.deleteOne();
  const { syncLeadFollowUpDates } = require('../utils/followUpHelpers');
  await syncLeadFollowUpDates(leadId);
  res.json({ message: 'Follow-up deleted' });
});

const markMissedFollowUps = asyncHandler(async (req, res) => {
  await syncMissedFollowUps(req);
  res.json({ message: 'Missed follow-ups updated' });
});

module.exports = {
  listFollowUps,
  getFollowUpSummary,
  getFollowUp,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  markMissedFollowUps,
};
