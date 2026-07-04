/** App-aware login path (supports /app/ basename on production). */
export function getLoginPath() {
  const base = import.meta.env.BASE_URL || '/';
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalized || ''}/login` || '/login';
}

export function goToLogin() {
  const path = getLoginPath();
  if (typeof window === 'undefined') return path;
  // Hard navigation clears layout/theme state and avoids blank Suspense screens.
  window.location.replace(path);
  return path;
}
