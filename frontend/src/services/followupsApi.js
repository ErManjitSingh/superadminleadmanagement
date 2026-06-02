import API from '../api/axios';
import { buildListParams, unwrapPagination } from '../utils/apiHelpers';

export async function fetchFollowUps(params = {}, endpoint = '/followups') {
  const { data } = await API.get(endpoint, {
    params: buildListParams(params),
    skipSuccessToast: true,
  });
  return unwrapPagination(data);
}

export async function fetchFollowUpSummary(endpoint = '/followups/summary') {
  const { data } = await API.get(endpoint, { skipSuccessToast: true });
  return data;
}

export async function fetchFollowUpsCalendar(params = {}, endpoint = '/followups') {
  const { data } = await API.get(endpoint, {
    params: buildListParams({ ...params, page: 1, limit: 300 }),
    skipSuccessToast: true,
  });
  return unwrapPagination(data);
}
