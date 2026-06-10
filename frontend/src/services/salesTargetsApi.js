import API from '../api/axios';

export async function fetchSalesTargets(params = {}) {
  const { data } = await API.get('/sales-targets', { params, skipSuccessToast: true });
  return data;
}

export async function setSalesTarget(payload) {
  const { data } = await API.post('/sales-targets', payload);
  return data;
}
