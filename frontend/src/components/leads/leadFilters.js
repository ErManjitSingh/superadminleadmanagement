import { normalizeLeadStatus } from '../../utils/leadUtils';

export function applyLeadFilters(leads, filters, routeStatus = '') {
  let result = [...leads];

  if (routeStatus) {
    result = result.filter((l) => normalizeLeadStatus(l.status) === routeStatus);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q)
    );
  }

  if (filters.status) {
    result = result.filter((l) => normalizeLeadStatus(l.status) === filters.status);
  }

  if (filters.destination) {
    result = result.filter((l) => l.destination === filters.destination);
  }

  if (filters.source) {
    const key = filters.source.toLowerCase();
    result = result.filter((l) => (l.source || '').toLowerCase() === key);
  }

  if (filters.agent) {
    result = result.filter((l) => l.assignedTo?._id === filters.agent);
  }

  if (filters.travelMonth !== '') {
    const month = Number(filters.travelMonth);
    result = result.filter((l) => l.travelDate && new Date(l.travelDate).getMonth() === month);
  }

  if (filters.budgetMin) {
    result = result.filter((l) => l.budget >= Number(filters.budgetMin));
  }

  if (filters.budgetMax) {
    result = result.filter((l) => l.budget <= Number(filters.budgetMax));
  }

  if (filters.dateFrom) {
    result = result.filter((l) => l.createdAt && new Date(l.createdAt) >= new Date(filters.dateFrom));
  }

  if (filters.dateTo) {
    result = result.filter((l) => l.createdAt && new Date(l.createdAt) <= new Date(filters.dateTo));
  }

  return result;
}

export function countActiveFilters(filters) {
  return Object.entries(filters).filter(([k, v]) => v !== '' && k !== 'search').length;
}

export function groupLeadsByStatus(leads, columns) {
  const groups = {};
  columns.forEach((c) => { groups[c.value] = []; });
  leads.forEach((lead) => {
    const status = normalizeLeadStatus(lead.status);
    if (groups[status]) groups[status].push(lead);
    else if (groups.new) groups.new.push(lead);
  });
  return groups;
}
