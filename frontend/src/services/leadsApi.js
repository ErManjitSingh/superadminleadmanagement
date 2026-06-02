import API from '../api/axios';
import { buildListParams, unwrapPagination } from '../utils/apiHelpers';

export async function fetchLeads(params = {}) {
  const { data } = await API.get('/leads', {
    params: buildListParams(params),
    skipSuccessToast: true,
  });
  return unwrapPagination(data);
}

export async function fetchLeadsKanban(params = {}) {
  const { data } = await API.get('/leads', {
    params: buildListParams({ ...params, view: 'kanban', limit: 200, page: 1 }),
    skipSuccessToast: true,
  });
  return unwrapPagination(data);
}
