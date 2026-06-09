const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const DETAIL_MAX_LIMIT = 50;

function clampLimit(limit, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const parsed = parseInt(limit, 10);
  const base = Number.isFinite(parsed) && parsed > 0 ? parsed : defaultLimit;
  return Math.min(Math.max(1, base), maxLimit);
}

function parsePagination(query = {}, options = {}) {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_LIMIT;
  const page = Math.max(1, parseInt(query.page, 10) || 1);

  const limit = clampLimit(query.limit, { defaultLimit, maxLimit });

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

const CURSOR_SEPARATOR = '|';
const DEEP_PAGE_THRESHOLD = 10;

function encodeCursor(doc, sortField = 'createdAt') {
  if (!doc?._id) return null;
  const raw = doc[sortField];
  const sortToken = raw instanceof Date ? raw.toISOString() : String(raw ?? '');
  return `${sortToken}${CURSOR_SEPARATOR}${doc._id}`;
}

function parseCursor(cursor) {
  if (!cursor || typeof cursor !== 'string') return null;
  const sep = cursor.lastIndexOf(CURSOR_SEPARATOR);
  if (sep <= 0) return null;
  const sortToken = cursor.slice(0, sep);
  const id = cursor.slice(sep + 1);
  if (!id) return null;
  const asDate = new Date(sortToken);
  return {
    sortValue: Number.isNaN(asDate.getTime()) ? sortToken : asDate,
    id,
  };
}

function buildCursorFilter(baseFilter, cursor, sortField = 'createdAt', sortDir = -1) {
  const parsed = parseCursor(cursor);
  if (!parsed) return baseFilter;

  const cmp = sortDir === -1 ? '$lt' : '$gt';
  return {
    ...baseFilter,
    $or: [
      { [sortField]: { [cmp]: parsed.sortValue } },
      { [sortField]: parsed.sortValue, _id: { [cmp]: parsed.id } },
    ],
  };
}

function paginatedResponse(data, { page, limit, total, nextCursor, hasMore } = {}) {
  const response = {
    data,
    pagination: {
      page,
      limit,
      total: total ?? null,
      totalPages: total != null && total > 0 ? Math.ceil(total / limit) : null,
    },
  };
  if (nextCursor) {
    response.nextCursor = nextCursor;
    response.hasMore = hasMore ?? true;
  }
  return response;
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  DETAIL_MAX_LIMIT,
  DEEP_PAGE_THRESHOLD,
  CURSOR_SEPARATOR,
  clampLimit,
  parsePagination,
  parseSort,
  encodeCursor,
  parseCursor,
  buildCursorFilter,
  paginatedResponse,
};
