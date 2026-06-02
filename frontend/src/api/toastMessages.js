/** Default success copy for API mutations (Hindi-friendly where noted). */
export function getApiSuccessMessage(config, data) {
  if (config?.successMessage) return config.successMessage;
  const msg = data?.message;
  if (typeof msg === 'string' && msg.length < 120 && !/token|jwt/i.test(msg)) {
    return msg;
  }

  const url = (config?.url || '').split('?')[0];
  const method = (config?.method || '').toUpperCase();

  if (method === 'DELETE') {
    if (url.includes('/users')) return 'User delete ho gaya';
    if (url.includes('/roles')) return 'Role delete ho gaya';
    if (url.includes('/leads')) return 'Lead delete ho gayi';
    if (url.includes('/followups')) return 'Follow-up delete ho gaya';
    return 'Delete ho gaya';
  }

  if (method === 'POST') {
    if (url.includes('/auth/login')) return 'Login successful';
    if (url.includes('/users/invite')) return 'Invite bhej diya gaya';
    if (url.includes('/users/reset-password')) return 'Password reset ho gaya';
    if (url.includes('/users')) return 'User add ho gaya';
    if (url.includes('/roles')) return 'Role add ho gaya';
    if (url.includes('/leads')) return 'Lead add ho gayi';
    if (url.includes('/followups')) return 'Follow-up add ho gaya';
    if (url.includes('/quotations')) return 'Quotation save ho gayi';
    if (url.includes('/attendance/check-in')) return 'Check-in ho gaya';
    if (url.includes('/attendance/check-out')) return 'Check-out ho gaya';
    if (url.includes('/assign')) return 'Assign ho gaya';
    if (url.includes('/notes')) return 'Note save ho gaya';
    return 'Save ho gaya';
  }

  if (method === 'PUT' || method === 'PATCH') {
    if (url.includes('/followups')) return 'Follow-up update ho gaya';
    if (url.includes('/users')) return 'User update ho gaya';
    if (url.includes('/leads')) return 'Lead update ho gayi';
    if (url.includes('/quotations')) return 'Quotation update ho gayi';
    return 'Update ho gaya';
  }

  return 'Ho gaya';
}

export function shouldSkipSuccessToast(config) {
  if (config?.skipSuccessToast) return true;
  const url = config?.url || '';
  if (config?.method?.toUpperCase() === 'GET') return true;
  const method = config?.method?.toUpperCase();
  if (method === 'GET') return true;
  return (
    url.includes('/nav-counts') ||
    url.includes('/auth/me') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/login')
  );
}

export function getApiErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    'Kuch galat ho gaya — dubara try karein'
  );
}
