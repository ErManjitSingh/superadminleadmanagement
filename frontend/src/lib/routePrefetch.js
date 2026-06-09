const prefetched = new Set();

const routeLoaders = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/leads': () => import('../pages/Leads'),
  '/leads/new-leads': () => import('../pages/Leads'),
  '/leads/unassigned': () => import('../pages/Leads'),
  '/leads/assigned': () => import('../pages/Leads'),
  '/leads/converted': () => import('../pages/Leads'),
  '/leads/lost': () => import('../pages/Leads'),
  '/followups': () => import('../pages/Followups'),
  '/quotations': () => import('../pages/Quotations'),
  '/reports': () => import('../pages/Reports'),
  '/sales-manager/dashboard': () => import('../components/sales-manager/ManagerDashboard'),
  '/sales-executive/dashboard': () => import('../components/sales-executive/ExecutiveDashboard'),
  '/team-leader/dashboard': () => import('../components/team-leader/LeaderDashboard'),
  '/operations-manager/dashboard': () => import('../components/operations-manager/OperationsDashboard'),
};

function resolveLoader(path) {
  if (!path) return null;
  if (routeLoaders[path]) return routeLoaders[path];
  const match = Object.keys(routeLoaders)
    .filter((key) => path.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ? routeLoaders[match] : null;
}

export function prefetchRoute(path) {
  const loader = resolveLoader(path);
  if (!loader || prefetched.has(path)) return;
  prefetched.add(path);
  loader().catch(() => prefetched.delete(path));
}
