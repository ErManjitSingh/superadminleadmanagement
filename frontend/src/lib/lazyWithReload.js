import { lazy } from 'react';

const RELOAD_GUARD_KEY = 'chunk-reload-at';
const RELOAD_COOLDOWN_MS = 10000;

function shouldReloadOnce() {
  try {
    const now = Date.now();
    const last = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (now - last > RELOAD_COOLDOWN_MS) {
      window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

// After a new deploy the hashed chunk filenames change and any already-loaded
// app (or a cached index.html) points at chunks that no longer exist. Fetching
// them yields an HTML 404 page, which the browser rejects with a MIME-type error
// and the route renders blank. Reloading once pulls the fresh index.html + chunks.
export function reloadForStaleChunk() {
  if (shouldReloadOnce()) {
    window.location.reload();
    return true;
  }
  return false;
}

export function lazyWithReload(factory) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (reloadForStaleChunk()) {
        return new Promise(() => {});
      }
      throw err;
    }
  });
}
