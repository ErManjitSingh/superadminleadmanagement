/** Default success copy for API mutations. */
export function getApiSuccessMessage(config, data) {
  if (config?.successMessage) return config.successMessage;
  const msg = data?.message;
  if (typeof msg === 'string' && msg.length < 120 && !/token|jwt/i.test(msg)) {
    return msg;
  }

  const url = (config?.url || '').split('?')[0];
  const method = (config?.method || '').toUpperCase();

  if (method === 'DELETE') {
    if (url.includes('/users')) return 'User deleted';
    if (url.includes('/roles')) return 'Role deleted';
    if (url.includes('/leads')) return 'Lead deleted';
    if (url.includes('/followups')) return 'Follow-up deleted';
    return 'Deleted successfully';
  }

  if (method === 'POST') {
    if (url.includes('/auth/login')) return 'Login successful';
    if (url.includes('/users/invite')) return 'Invite sent';
    if (url.includes('/users/reset-password')) return 'Password reset successfully';
    if (url.includes('/users')) return 'User added';
    if (url.includes('/roles')) return 'Role added';
    if (url.includes('/leads')) return 'Lead added';
    if (url.includes('/followups')) return 'Follow-up added';
    if (url.includes('/quotations')) return 'Quotation saved';
    if (url.includes('/attendance/check-in')) return 'Checked in';
    if (url.includes('/attendance/check-out')) return 'Checked out';
    if (url.includes('/assign')) return 'Assigned successfully';
    if (url.includes('/notes')) return 'Note saved';
    return 'Saved successfully';
  }

  if (method === 'PUT' || method === 'PATCH') {
    if (url.includes('/followups')) return 'Follow-up updated';
    if (url.includes('/users')) return 'User updated';
    if (url.includes('/leads')) return 'Lead updated';
    if (url.includes('/quotations')) return 'Quotation updated';
    return 'Updated successfully';
  }

  return 'Done';
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
    'Something went wrong. Please try again.'
  );
}
