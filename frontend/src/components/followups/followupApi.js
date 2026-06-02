import API from '../../api/axios';

/** Create follow-up (sales executive only). */
export async function createExecutiveFollowUp(payload) {
  const res = await API.post('/sales-executive/followups', payload, { skipErrorToast: true });
  return res.data;
}

export async function updateExecutiveFollowUp(id, payload) {
  const res = await API.put(`/sales-executive/followups/${id}`, payload, { skipErrorToast: true });
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
