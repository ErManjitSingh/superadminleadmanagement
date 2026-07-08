import API from '../api/axios';

export async function fetchEmailIntegrationSettings() {
  const { data } = await API.get('/company/email/settings', { skipSuccessToast: true });
  return data;
}

export async function testEmailSmtp(payload) {
  const { data } = await API.post('/company/email/test', payload, { skipSuccessToast: true });
  return data;
}

export async function saveEmailIntegration(payload) {
  const { data } = await API.post('/company/email/save', payload);
  return data;
}

export async function updateEmailIntegration(payload) {
  const { data } = await API.put('/company/email/settings', payload);
  return data;
}

export async function disconnectEmailIntegration() {
  const { data } = await API.delete('/company/email/disconnect');
  return data;
}

export async function fetchEmailIntegrationLogs(params = {}) {
  const { data } = await API.get('/company/email/logs', { params, skipSuccessToast: true });
  return data;
}
