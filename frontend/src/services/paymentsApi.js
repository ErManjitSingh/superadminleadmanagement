import API from '../api/axios';

export async function listPayments(params = {}) {
  const { data } = await API.get('/payments', { params, skipErrorToast: true });
  return Array.isArray(data) ? data : data?.data || [];
}

export async function getPayment(id) {
  const { data } = await API.get(`/payments/${id}`, { skipErrorToast: true });
  return data;
}

export async function createPayment(payload) {
  const { data } = await API.post('/payments', payload);
  return data;
}

export async function updatePayment(id, payload) {
  const { data } = await API.put(`/payments/${id}`, payload);
  return data;
}

export async function deletePayment(id) {
  const { data } = await API.delete(`/payments/${id}`);
  return data;
}

export async function addRefund(id, payload) {
  const { data } = await API.post(`/payments/${id}/refunds`, payload);
  return data;
}
