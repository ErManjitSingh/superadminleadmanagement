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

export async function fetchMailbox(params = {}) {
  const { data } = await API.get('/emails/mailbox', { params, skipSuccessToast: true });
  return data;
}

export async function fetchMailboxMessage(type, id) {
  const { data } = await API.get(`/emails/messages/${type}/${id}`, { skipSuccessToast: true });
  return data;
}

export async function syncEmailReplies({ silent = false } = {}) {
  const { data } = await API.post('/emails/sync-replies', {}, { skipSuccessToast: silent });
  return data;
}
