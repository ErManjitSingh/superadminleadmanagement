import API from '../../api/axios';

/** Create a follow-up through the caller's role-appropriate endpoint. */
export async function createExecutiveFollowUp(payload, endpoint = '/sales-executive/followups') {
  const res = await API.post(endpoint, payload, { skipErrorToast: true });
  return res.data;
}

export async function updateExecutiveFollowUp(id, payload, endpoint = '/sales-executive/followups') {
  const res = await API.put(`${endpoint}/${id}`, payload, { skipErrorToast: true });
  return res.data;
}

export function buildFollowUpPayload(form) {
  return {
    lead: form.lead,
    type: form.type || 'call',
    category: form.category || 'warm',
    scheduledAt: new Date(form.scheduledAt).toISOString(),
    notes: form.notes || form.remarks || '',
    priority: form.priority || 'medium',
    outcome: form.outcome || '',
  };
}
