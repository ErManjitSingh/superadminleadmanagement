const DISMISS_KEY = 'app-update-dismissed-build';

function extractIndexHash(source) {
  const match = String(source).match(/assets\/index-([A-Za-z0-9_-]+)\.js/);
  return match?.[1] ?? null;
}

export function getLoadedIndexHash() {
  const script = document.querySelector('script[type="module"][src*="assets/index"]');
  if (!script) return null;
  return extractIndexHash(script.getAttribute('src') || script.src);
}

export function getCurrentBuildMeta() {
  return {
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    buildId: import.meta.env.VITE_BUILD_ID || getLoadedIndexHash() || 'dev',
    builtAt: import.meta.env.VITE_BUILD_TIME || null,
  };
}

export async function fetchLatestBuildMeta() {
  const base = import.meta.env.BASE_URL || '/';

  try {
    const res = await fetch(`${base}build-meta.json?nc=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.buildId) return data;
    }
  } catch {
    /* fall through */
  }

  try {
    const res = await fetch(`${base}index.html?nc=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const hash = extractIndexHash(html);
    if (!hash) return null;
    return { version: null, buildId: hash, builtAt: null };
  } catch {
    return null;
  }
}

export function formatVersionLabel({ version, buildId } = {}) {
  const ver = version ? `v${version}` : 'v—';
  const build = buildId ? `build ${buildId}` : 'build —';
  return `${ver} · ${build}`;
}

export function formatReleaseDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

export function isUpdateDismissed(buildId) {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === buildId;
  } catch {
    return false;
  }
}

export function dismissUpdate(buildId) {
  try {
    sessionStorage.setItem(DISMISS_KEY, buildId);
  } catch {
    /* ignore */
  }
}

export function reloadApp() {
  window.location.reload();
}
