const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const KANBAN_MAX_LIMIT = 200;

function parsePagination(query = {}, options = {}) {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_LIMIT;
  const page = Math.max(1, parseInt(query.page, 10) || 1);

  let limit = parseInt(query.limit, 10) || defaultLimit;
  if (query.view === 'kanban') {
    limit = Math.min(Math.max(1, limit), KANBAN_MAX_LIMIT);
  } else {
    limit = Math.min(Math.max(1, limit), maxLimit);
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function parseSort(query = {}, defaultSort = { createdAt: -1 }) {
  const sortBy = query.sortBy || query.sort;
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  if (!sortBy) return defaultSort;

  const allowed = optionsAllowedSort(sortBy);
  if (!allowed) return defaultSort;

  return { [sortBy]: sortOrder };
}

function optionsAllowedSort(field) {
  const safe = [
    'createdAt',
    'updatedAt',
    'name',
    'status',
    'destination',
    'budget',
    'travelDate',
    'scheduledAt',
    'quoteNumber',
  ];
  return safe.includes(field) ? field : null;
}

function paginatedResponse(data, { page, limit, total }) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
    },
  };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  KANBAN_MAX_LIMIT,
  parsePagination,
  parseSort,
  paginatedResponse,
};
