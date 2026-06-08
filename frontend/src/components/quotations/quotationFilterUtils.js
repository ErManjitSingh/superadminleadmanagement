export const emptyQuotationFilters = {
  search: '',
  status: '',
  destination: '',
  executiveId: '',
  dateFrom: '',
  dateTo: '',
};

export function countQuotationActiveFilters(filters, { ignoreStatus = false } = {}) {
  let count = 0;
  if (filters.search?.trim()) count += 1;
  if (!ignoreStatus && filters.status) count += 1;
  if (filters.destination) count += 1;
  if (filters.executiveId) count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  return count;
}

export function buildQuotationQueryParams(filters, { ignoreStatus = false } = {}) {
  const params = {};
  if (filters.search?.trim()) params.search = filters.search.trim();
  if (!ignoreStatus && filters.status) params.status = filters.status;
  if (filters.destination) params.destination = filters.destination;
  if (filters.executiveId) params.executiveId = filters.executiveId;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  return params;
}

export const EXEC_QUOTE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'negotiation', label: 'Negotiation' },
];

export const SEGMENT_LABELS = {
  pending: 'Pending Approval',
  negotiation: 'Negotiation',
  approved: 'Approved',
  rejected: 'Rejected',
  all: 'All Quotations',
};
