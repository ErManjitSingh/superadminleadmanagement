import API from '../api/axios';

export async function fetchEmailTemplates(params = {}) {
  const { data } = await API.get('/email-templates', { params, skipSuccessToast: true });
  return data;
}

export async function sendLeadEmail(leadId, payload, endpointPrefix = '/leads') {
  const { data } = await API.post(`${endpointPrefix}/${leadId}/send-email`, payload);
  return data;
}

export async function fetchLeadEmailHistory(leadId, endpointPrefix = '/leads') {
  const { data } = await API.get(`${endpointPrefix}/${leadId}/email-history`, { skipSuccessToast: true });
  return data;
}

export async function fetchEmailStats() {
  const { data } = await API.get('/emails/stats', { skipSuccessToast: true });
  return data;
}
