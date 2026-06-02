const Quotation = require('../models/Quotation');
const { QUOTATION_POPULATE, buildLeadSearchFilter } = require('../utils/queryHelpers');
const { parsePagination, parseSort, paginatedResponse } = require('../utils/pagination');

function buildQuotationListFilter(query = {}) {
  const { status, search, leadId } = query;
  const filter = {};

  if (status) filter.status = status;
  if (leadId) filter.lead = leadId;

  if (search?.trim()) {
    const q = search.trim();
    filter.$or = [{ quoteNumber: { $regex: q, $options: 'i' } }];
    if (Number.isFinite(Number(q))) {
      filter.$or.push({ 'pricing.total': Number(q) });
    }
  }

  return filter;
}

async function findQuotationsPaginated(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, { createdAt: -1 });
  const filter = buildQuotationListFilter(query);

  const [rows, total] = await Promise.all([
    Quotation.find(filter).populate(QUOTATION_POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Quotation.countDocuments(filter),
  ]);

  return paginatedResponse(rows, { page, limit, total });
}

module.exports = {
  buildQuotationListFilter,
  findQuotationsPaginated,
};
