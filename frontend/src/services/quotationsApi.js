import API from '../api/axios';
import { buildListParams, unwrapPagination } from '../utils/apiHelpers';

export async function fetchQuotations(params = {}, endpoint = '/quotations') {
  const { data } = await API.get(endpoint, {
    params: buildListParams(params),
    skipSuccessToast: true,
  });
  return unwrapPagination(data);
}

export async function fetchQuotationStats(params = {}) {
  const { data } = await API.get('/quotations/stats', {
    params,
    skipSuccessToast: true,
  });
  return data;
}
