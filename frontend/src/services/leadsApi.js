import API from '../api/axios';
import { buildListParams, unwrapPagination } from '../utils/apiHelpers';

export async function fetchLeads(params = {}) {
  const { data } = await API.get('/leads', {
    params: buildListParams(params),
    skipSuccessToast: true,
  });
  return unwrapPagination(data);
}

/** Per-column server fetch — max 25 leads × 8 columns per request */
export async function fetchLeadsKanban(params = {}) {
  const { data } = await API.get('/leads/kanban-board', {
    params: buildListParams(params),
    skipSuccessToast: true,
  });
  return {
    data: data.data || [],
    columns: data.columns || [],
    totalLeads: data.totalLeads ?? 0,
    perColumn: data.perColumn ?? 25,
  };
}
