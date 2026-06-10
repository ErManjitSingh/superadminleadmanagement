import API from '../api/axios';

export async function createEmailTemplate(payload) {
  const { data } = await API.post('/email-templates', payload);
  return data;
}

export async function updateEmailTemplate(id, payload) {
  const { data } = await API.put(`/email-templates/${id}`, payload);
  return data;
}

export async function deleteEmailTemplate(id) {
  const { data } = await API.delete(`/email-templates/${id}`);
  return data;
}
