const FollowUp = require('../models/FollowUp');
const Quotation = require('../models/Quotation');

function computeAgingBucket(createdAt) {
  if (!createdAt) return '0_7';
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days <= 7) return '0_7';
  if (days <= 15) return '8_15';
  if (days <= 30) return '16_30';
  return '30_plus';
}

function budgetScore(budget = 0) {
  if (budget >= 300000) return 100;
  if (budget >= 150000) return 80;
  if (budget >= 75000) return 60;
  if (budget >= 30000) return 40;
  if (budget > 0) return 25;
  return 0;
}

function travelDateScore(travelDate) {
  if (!travelDate) return 30;
  const days = Math.floor((new Date(travelDate).getTime() - Date.now()) / 86400000);
  if (days <= 0) return 20;
  if (days <= 30) return 100;
  if (days <= 60) return 80;
  if (days <= 90) return 60;
  return 40;
}

function temperatureFromScore(smartScore, lead = {}) {
  if (lead.isVip) return 'vip';
  if (smartScore >= 75 || lead.isHot) return 'hot';
  if (smartScore >= 45) return 'warm';
  return 'cold';
}

async function enrichLeadMetrics(lead) {
  const leadId = lead._id;
  const [followUps, quotations] = await Promise.all([
    FollowUp.find({ lead: leadId }).select('status').lean(),
    Quotation.find({ lead: leadId }).select('status').lean(),
  ]);

  const totalFu = followUps.length || 1;
  const completedFu = followUps.filter((f) => f.status === 'completed').length;
  const followUpScore = Math.round((completedFu / totalFu) * 100);

  const hasQuotation = quotations.length > 0;
  const sentQuote = quotations.some((q) => ['sent', 'approved', 'accepted'].includes(q.status));
  const approvedQuote = quotations.some((q) => ['approved', 'accepted'].includes(q.status));
  let quotationScore = 0;
  if (approvedQuote) quotationScore = 100;
  else if (sentQuote) quotationScore = 70;
  else if (hasQuotation) quotationScore = 40;

  const responseScore = lead.responseRate || (lead.firstContactAt ? 80 : 20);

  const smartScore = Math.min(
    100,
    Math.round(
      budgetScore(lead.budget) * 0.25 +
        travelDateScore(lead.travelDate) * 0.2 +
        responseScore * 0.15 +
        followUpScore * 0.2 +
        quotationScore * 0.2
    )
  );

  const temperature = temperatureFromScore(smartScore, lead);
  const agingBucket = computeAgingBucket(lead.createdAt);
  const isVip = lead.isVip || lead.budget >= 300000;

  return { smartScore, temperature, agingBucket, isVip };
}

function computeMetricsSync(lead = {}) {
  const smartScore = Math.min(
    100,
    Math.round(
      budgetScore(lead.budget) * 0.25 +
        travelDateScore(lead.travelDate) * 0.2 +
        20 * 0.35
    )
  );
  const temperature = temperatureFromScore(smartScore, lead);
  const agingBucket = computeAgingBucket(lead.createdAt || new Date());
  const isVip = lead.isVip || lead.budget >= 300000;
  return { smartScore, temperature, agingBucket, isVip };
}

async function applyLeadMetrics(lead) {
  const metrics = lead._id ? await enrichLeadMetrics(lead) : computeMetricsSync(lead);
  lead.smartScore = metrics.smartScore;
  lead.temperature = metrics.temperature;
  lead.agingBucket = metrics.agingBucket;
  lead.isVip = metrics.isVip;
  if (metrics.temperature === 'hot') lead.isHot = true;
  return lead;
}

module.exports = {
  computeAgingBucket,
  budgetScore,
  travelDateScore,
  temperatureFromScore,
  computeMetricsSync,
  enrichLeadMetrics,
  applyLeadMetrics,
};
