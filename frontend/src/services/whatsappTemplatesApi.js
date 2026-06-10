import API from '../api/axios';

export async function fetchWhatsAppTemplates() {
  const { data } = await API.get('/whatsapp-templates', { skipSuccessToast: true });
  return data;
}

export async function createWhatsAppTemplate(payload) {
  const { data } = await API.post('/whatsapp-templates', payload);
  return data;
}

export async function updateWhatsAppTemplate(id, payload) {
  const { data } = await API.put(`/whatsapp-templates/${id}`, payload);
  return data;
}

export async function deleteWhatsAppTemplate(id) {
  const { data } = await API.delete(`/whatsapp-templates/${id}`);
  return data;
}

export async function logWhatsAppContact(leadId, { templateId } = {}, endpointPrefix = '/leads') {
  const { data } = await API.post(`${endpointPrefix}/${leadId}/whatsapp-contact`, {
    templateId: templateId || undefined,
  }, { skipSuccessToast: true });
  return data;
}
