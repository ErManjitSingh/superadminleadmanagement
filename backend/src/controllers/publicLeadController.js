const asyncHandler = require('../utils/asyncHandler');
const { ingestWebsiteLead } = require('../services/websiteLeadIngestService');

/**
 * POST /api/public/leads
 * Public website quote/enquiry → tenant CRM lead.
 * Auth: X-Lead-Key (or body.apiKey) matching company websiteLeadIngest / env key.
 */
const submitPublicLead = asyncHandler(async (req, res) => {
  const result = await ingestWebsiteLead(req);
  res.status(201).json(result);
});

module.exports = { submitPublicLead };
