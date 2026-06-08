const Lead = require('../models/Lead');
const { buildLeadSearchFilter, LEAD_LIST_POPULATE, enrichLead } = require('../utils/queryHelpers');
const { parsePagination, parseSort, paginatedResponse } = require('../utils/pagination');
const { withBranch } = require('../utils/branchScope');

function buildLeadListFilter(query = {}) {
  const {
    status,
    search,
    filter: listFilter,
    destination,
    source,
    agent,
    travelMonth,
    budgetMin,
    budgetMax,
    dateFrom,
    dateTo,
    reactivationStage,
    reactivatedOnly,
    executiveId,
    reactivatedFrom,
    reactivatedTo,
  } = query;

  const mongoFilter = { ...buildLeadSearchFilter(search), isDeleted: { $ne: true } };

  if (status) mongoFilter.status = status;
  if (reactivatedOnly === 'true') mongoFilter['reactivation.isReactivated'] = true;
  if (reactivationStage) mongoFilter['reactivation.stage'] = reactivationStage;
  if (executiveId) mongoFilter.assignedTo = executiveId;
  const reactFrom = reactivatedFrom;
  const reactTo = reactivatedTo;
  if (reactFrom || reactTo) {
    mongoFilter['reactivation.reactivatedAt'] = {};
    if (reactFrom) mongoFilter['reactivation.reactivatedAt'].$gte = new Date(reactFrom);
    if (reactTo) {
      const end = new Date(reactTo);
      end.setHours(23, 59, 59, 999);
      mongoFilter['reactivation.reactivatedAt'].$lte = end;
    }
  }
  if (listFilter === 'unassigned') mongoFilter.assignedTo = null;
  else if (listFilter === 'assigned') mongoFilter.assignedTo = { $ne: null };
  if (destination) mongoFilter.destination = destination;
  if (source) mongoFilter.source = source;
  if (agent) mongoFilter.assignedTo = agent;

  if (budgetMin || budgetMax) {
    mongoFilter.budget = {};
    if (budgetMin) mongoFilter.budget.$gte = Number(budgetMin);
    if (budgetMax) mongoFilter.budget.$lte = Number(budgetMax);
  }

  if (dateFrom || dateTo) {
    mongoFilter.createdAt = {};
    if (dateFrom) mongoFilter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      mongoFilter.createdAt.$lte = end;
    }
  }

  if (travelMonth !== undefined && travelMonth !== '') {
    mongoFilter.$expr = { $eq: [{ $month: '$travelDate' }, Number(travelMonth) + 1] };
  }

  return mongoFilter;
}

async function findLeadsPaginated(query = {}, { branchId } = {}) {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, { createdAt: -1 });
  const filter = withBranch(buildLeadListFilter(query), branchId);

  const [rows, total] = await Promise.all([
    Lead.find(filter)
      .select('-notes')
      .populate(LEAD_LIST_POPULATE)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(filter),
  ]);

  return paginatedResponse(rows.map(enrichLead), { page, limit, total });
}

async function countLeads(query = {}, { branchId } = {}) {
  return Lead.countDocuments(withBranch(buildLeadListFilter(query), branchId));
}

module.exports = {
  buildLeadListFilter,
  findLeadsPaginated,
  countLeads,
};
