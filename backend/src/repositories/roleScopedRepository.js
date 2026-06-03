const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const Quotation = require('../models/Quotation');
const {
  LEAD_POPULATE,
  FOLLOWUP_POPULATE,
  QUOTATION_POPULATE,
  enrichLead,
  buildLeadSearchFilter,
  buildFollowUpTabFilter,
  buildFollowUpCategoryFilter,
  startOfDay,
} = require('../utils/queryHelpers');
const { parsePagination, parseSort, paginatedResponse } = require('../utils/pagination');
const { withBranch } = require('../utils/branchScope');

function applyReactivationQueryFilters(mongoFilter, query = {}) {
  const stage = query.reactivationStage || query.stage;
  if (stage) mongoFilter['reactivation.stage'] = stage;
  if (query.status) mongoFilter.status = query.status;
  if (query.executiveId) mongoFilter.assignedTo = query.executiveId;
  const from = query.reactivatedFrom || query.from;
  const to = query.reactivatedTo || query.to;
  if (from || to) {
    mongoFilter['reactivation.reactivatedAt'] = {};
    if (from) mongoFilter['reactivation.reactivatedAt'].$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      mongoFilter['reactivation.reactivatedAt'].$lte = end;
    }
  }
}

function buildManagerLeadFilter(query = {}) {
  const { filter, search } = query;
  const mongoFilter = { ...buildLeadSearchFilter(search) };

  if (filter === 'unassigned') mongoFilter.assignedTo = null;
  else if (filter === 'assigned') mongoFilter.assignedTo = { $ne: null };
  else if (filter === 'lost') mongoFilter.status = { $in: ['lost', 'booked_from_another_company'] };
  else if (filter === 'reactivated') {
    mongoFilter['reactivation.isReactivated'] = true;
    applyReactivationQueryFilters(mongoFilter, query);
  } else if (filter === 'hot') {
    mongoFilter.isHot = true;
    mongoFilter.status = { $nin: ['lost', 'booked_from_another_company'] };
  }

  return mongoFilter;
}

function buildExecutiveLeadFilter(filterKey) {
  if (filterKey === 'new') return { status: 'new' };
  if (filterKey === 'contacted') return { status: 'contacted' };
  if (filterKey === 'follow-up') return { status: { $in: ['follow_up', 'negotiation'] } };
  if (filterKey === 'converted') return { status: 'converted' };
  if (filterKey === 'lost') return { status: { $in: ['lost', 'booked_from_another_company'] } };
  if (filterKey === 'hot') return { isHot: true };
  return {};
}

async function findManagerLeadsPaginated(query = {}, options = {}) {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, { createdAt: -1 });
  const filter = withBranch(buildManagerLeadFilter(query), options.branchId);

  const [rows, total] = await Promise.all([
    Lead.find(filter).populate(LEAD_POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);

  return paginatedResponse(rows.map(enrichLead), { page, limit, total });
}

async function findExecutiveLeadsPaginated(userId, query = {}, options = {}) {
  const filterKey = query.filter || query.paramsFilter;
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, { createdAt: -1 });

  const filter = {
    assignedTo: userId,
    ...buildExecutiveLeadFilter(filterKey),
    ...buildLeadSearchFilter(query.search),
  };
  Object.assign(filter, withBranch({}, options.branchId));

  if (filterKey === 'hot') {
    filter.isHot = true;
    filter.status = { $nin: ['converted', 'lost', 'booked_from_another_company'] };
  }

  const [rows, total] = await Promise.all([
    Lead.find(filter).populate(LEAD_POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);

  return paginatedResponse(rows.map(enrichLead), { page, limit, total });
}

async function findTeamLeaderLeadsPaginated(squadFilter, query = {}, options = {}) {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, { createdAt: -1 });
  const extra = {};
  if (query.filter === 'reactivated') {
    extra['reactivation.isReactivated'] = true;
    applyReactivationQueryFilters(extra, query);
  }
  if (query.filter === 'lost') extra.status = { $in: ['lost', 'booked_from_another_company'] };
  if (query.filter === 'assigned') extra.assignedTo = { $ne: null };
  if (query.filter === 'unassigned') extra.assignedTo = null;
  if (query.filter === 'hot') {
    extra.$or = [{ isHot: true }, { leadScore: 'hot' }];
    extra.status = { $nin: ['converted', 'lost', 'booked_from_another_company'] };
  }
  const filter = withBranch({ ...squadFilter, ...extra, ...buildLeadSearchFilter(query.search) }, options.branchId);

  const [rows, total] = await Promise.all([
    Lead.find(filter).populate(LEAD_POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);

  return paginatedResponse(rows.map(enrichLead), { page, limit, total });
}

async function resolveLeadIdsForSearch(search, options = {}) {
  if (!search?.trim()) return null;
  const leads = await Lead.find(withBranch(buildLeadSearchFilter(search), options.branchId))
    .select('_id')
    .limit(200)
    .lean();
  return leads.map((l) => l._id);
}

async function findScopedFollowUpsPaginated(baseFilter, query = {}, options = {}) {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, { scheduledAt: 1 });

  const filter = {
    ...withBranch(baseFilter, options.branchId),
    ...buildFollowUpTabFilter(query.tab || query.kpiTab),
    ...buildFollowUpCategoryFilter(query.category),
  };

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  const leadIds = await resolveLeadIdsForSearch(query.search, options);
  if (leadIds) filter.lead = { $in: leadIds };

  const [rows, total] = await Promise.all([
    FollowUp.find(filter).populate(FOLLOWUP_POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    FollowUp.countDocuments(filter),
  ]);

  return paginatedResponse(rows, { page, limit, total });
}

async function findScopedQuotationsPaginated(baseFilter, query = {}, { mapRow, branchId } = {}) {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, { createdAt: -1 });
  const filter = withBranch(baseFilter, branchId);

  if (query.status) filter.status = query.status;
  if (query.search?.trim()) {
    filter.$or = [{ quoteNumber: { $regex: query.search.trim(), $options: 'i' } }];
  }

  const [rows, total] = await Promise.all([
    Quotation.find(filter).populate(QUOTATION_POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Quotation.countDocuments(filter),
  ]);

  const data = mapRow ? rows.map(mapRow) : rows;
  return paginatedResponse(data, { page, limit, total });
}

async function getFollowUpSummary(baseFilter = {}, options = {}) {
  const scopedBase = withBranch(baseFilter, options.branchId);
  const todayStart = startOfDay();
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const [total, today, missed, upcoming, completed] = await Promise.all([
    FollowUp.countDocuments(scopedBase),
    FollowUp.countDocuments({
      ...scopedBase,
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
    }),
    FollowUp.countDocuments({
      ...scopedBase,
      $or: [{ status: 'missed' }, { status: 'pending', scheduledAt: { $lt: todayStart } }],
    }),
    FollowUp.countDocuments({
      ...scopedBase,
      status: 'pending',
      scheduledAt: { $gt: todayEnd },
    }),
    FollowUp.countDocuments({ ...scopedBase, status: 'completed' }),
  ]);

  return { total, today, missed, upcoming, completed };
}

async function getQuotationStats(baseFilter = {}, options = {}) {
  const scopedBase = withBranch(baseFilter, options.branchId);
  const [total, sent, approved, pipelineAgg] = await Promise.all([
    Quotation.countDocuments(scopedBase),
    Quotation.countDocuments({ ...scopedBase, status: 'sent' }),
    Quotation.countDocuments({ ...scopedBase, status: 'approved' }),
    Quotation.aggregate([
      { $match: { ...scopedBase, status: { $in: ['sent', 'negotiation', 'pending_approval', 'draft'] } } },
      { $group: { _id: null, value: { $sum: { $ifNull: ['$pricing.total', 0] } } } },
    ]),
  ]);

  return {
    total,
    sent,
    approved,
    value: pipelineAgg[0]?.value || 0,
  };
}

module.exports = {
  findManagerLeadsPaginated,
  findExecutiveLeadsPaginated,
  findTeamLeaderLeadsPaginated,
  findScopedFollowUpsPaginated,
  findScopedQuotationsPaginated,
  getFollowUpSummary,
  getQuotationStats,
  buildExecutiveLeadFilter,
};
