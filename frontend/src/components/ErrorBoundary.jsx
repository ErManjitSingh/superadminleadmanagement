import { Component } from 'react';
import { reloadForStaleChunk } from '../lib/lazyWithReload';

function isChunkError(error) {
  const msg = String(error?.message || error || '');
  return (
    /Loading chunk|dynamically imported module|Importing a module script failed|MIME type|Failed to fetch/i.test(
      msg
    ) || error?.name === 'ChunkLoadError'
  );
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
    // A stale deploy leaves old chunk references that 404; reload once to recover.
    if (isChunkError(error) && reloadForStaleChunk()) {
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[CRM] Render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 p-6 text-center dark:bg-slate-950">
          <div className="max-w-sm space-y-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The page ran into a problem. Please reload to continue — your data is safe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
