import API from '../api/axios';

export async function checkLeadDuplicate({ phone, alternatePhone, email, excludeId }) {
  const { data } = await API.get('/leads/check-duplicate', {
    params: { phone, alternatePhone, email, excludeId },
    skipSuccessToast: true,
    skipErrorToast: true,
  });
  return data;
}

export async function fetchLeadTimeline(leadId, { page = 1, limit = 50 } = {}) {
  const { data } = await API.get(`/leads/${leadId}/timeline`, {
    params: { page, limit },
    skipSuccessToast: true,
  });
  return data;
}

export async function fetchLeadAudit(leadId, params = {}) {
  const { data } = await API.get(`/leads/${leadId}/audit`, {
    params,
    skipSuccessToast: true,
  });
  return data;
}

export async function fetchRecycleBin(params = {}) {
  const { data } = await API.get('/leads/recycle-bin', {
    params,
    skipSuccessToast: true,
  });
  return data;
}

export async function restoreLead(leadId) {
  const { data } = await API.post(`/leads/${leadId}/restore`);
  return data;
}

export async function fetchLeadAgingAnalytics() {
  const { data } = await API.get('/leads/analytics/aging', { skipSuccessToast: true });
  return data;
}
