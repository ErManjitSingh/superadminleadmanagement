function resolveDataKeys(req) {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return null;

  const path = (req.originalUrl || req.path || '').split('?')[0].toLowerCase();

  if (
    path.includes('/auth/') ||
    path.includes('/invites/accept') ||
    path.includes('/notifications')
  ) {
    return null;
  }

  const keys = new Set(['nav-counts']);

  const leadPath =
    /\/leads(\/|$)/.test(path) ||
    /\/sales-manager\/leads/.test(path) ||
    /\/sales-executive\/leads/.test(path) ||
    /\/team-leader\/leads/.test(path) ||
    /\/whatsapp\/leads/.test(path);

  if (leadPath || path.includes('/sales-manager/assign') || path.includes('/leads/assign')) {
    keys.add('leads');
    keys.add('dashboard');
  }

  if (path.includes('/followup')) {
    keys.add('followups');
    keys.add('leads');
    keys.add('dashboard');
  }

  if (path.includes('/users') || path.includes('/roles') || /\/team(\/|$)/.test(path)) {
    keys.add('users');
    keys.add('team');
    keys.add('dashboard');
  }

  if (path.includes('/sales-manager/teams') || /\/teams(\/|$)/.test(path)) {
    keys.add('teams');
    keys.add('leads');
    keys.add('dashboard');
  }

  if (path.includes('/quotations')) {
    keys.add('quotations');
    keys.add('leads');
    keys.add('dashboard');
  }

  if (
    path.includes('/packages') ||
    path.includes('/hotels') ||
    path.includes('/cabs') ||
    path.includes('/flights')
  ) {
    keys.add('packages');
  }

  if (path.includes('/whatsapp')) {
    keys.add('whatsapp');
    keys.add('leads');
  }

  if (path.includes('/operations-manager') || path.includes('/payments')) {
    keys.add('operations');
    keys.add('dashboard');
  }

  if (path.includes('/attendance')) {
    keys.add('attendance');
    keys.add('dashboard');
  }

  return [...keys];
}

module.exports = { resolveDataKeys };
