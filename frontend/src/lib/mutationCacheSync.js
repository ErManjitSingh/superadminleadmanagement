import {
  invalidateDashboard,
  invalidateLeadDetail,
  invalidateLeadLists,
  invalidateNavCounts,
} from './queryInvalidation';

export function normalizeKeys(keys) {
  if (!keys) return [];
  const list = Array.isArray(keys) ? keys : [keys];
  return [...new Set(list.filter(Boolean))];
}

let queryClientRef = null;

export function registerQueryClient(client) {
  queryClientRef = client;
}

/** Targeted React Query invalidation after same-tab mutations. */
export function invalidateFromMutationKeys(keys) {
  if (!queryClientRef) return;
  const normalized = normalizeKeys(keys);
  if (!normalized.length) return;

  const qc = queryClientRef;
  const tasks = [];

  if (normalized.includes('leads') || normalized.some((k) => k.startsWith('lead:'))) {
    tasks.push(invalidateLeadLists(qc));
    normalized
      .filter((k) => k.startsWith('lead:'))
      .forEach((k) => tasks.push(invalidateLeadDetail(qc, k.slice(5))));
  }

  if (normalized.includes('dashboard')) {
    tasks.push(invalidateDashboard(qc));
  }

  if (normalized.includes('nav-counts')) {
    tasks.push(invalidateNavCounts(qc));
  }

  if (normalized.includes('quotations')) {
    tasks.push(qc.invalidateQueries({ queryKey: ['quotations'] }));
  }

  if (normalized.includes('followups')) {
    tasks.push(qc.invalidateQueries({ queryKey: ['followups'] }));
  }

  if (normalized.includes('reports')) {
    tasks.push(qc.invalidateQueries({ queryKey: ['reports'] }));
  }

  if (normalized.includes('teams') || normalized.includes('team')) {
    tasks.push(qc.invalidateQueries({ queryKey: ['team-leader', 'my-team'] }));
  }

  return Promise.all(tasks);
}
