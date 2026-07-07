import { Component } from 'react';

const RELOAD_GUARD_KEY = 'sa-chunk-reload-at';
const RELOAD_COOLDOWN_MS = 10000;

function isChunkError(error) {
  const msg = String(error?.message || error || '');
  return (
    /Loading chunk|dynamically imported module|Importing a module script failed|MIME type|Failed to fetch/i.test(
      msg
    ) || error?.name === 'ChunkLoadError'
  );
}

function reloadOnce() {
  try {
    const now = Date.now();
    const last = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (now - last > RELOAD_COOLDOWN_MS) {
      window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
      window.location.reload();
      return true;
    }
  } catch {
    window.location.reload();
    return true;
  }
  return false;
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (isChunkError(error) && reloadOnce()) {
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[SuperAdmin] Render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f6fb] p-6 text-center">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-1 text-sm text-slate-500">
              The page failed to load. Please reload to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
