import API from '../api/axios';
import { buildListParams, unwrapPagination } from '../utils/apiHelpers';

export async function fetchLeads(params = {}) {
  const { data } = await API.get('/leads', {
    params: buildListParams(params),
    skipSuccessToast: true,
  });
  return unwrapPagination(data);
}
