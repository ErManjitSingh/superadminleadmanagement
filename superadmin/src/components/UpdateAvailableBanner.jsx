import { RefreshCw, Sparkles, X } from 'lucide-react';
import { useAppVersionCheck } from '../hooks/useAppVersionCheck';
import { Button } from './ui/button';

export default function UpdateAvailableBanner() {
  const { updateAvailable, latestBuild, handleUpdate, handleDismiss } = useAppVersionCheck();

  if (!updateAvailable || !latestBuild) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-violet-300/40 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 px-4 py-2 text-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="truncate font-medium">A new version is available.</span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            onClick={handleUpdate}
            className="h-7 border-0 bg-white px-3 text-xs text-violet-700 hover:bg-violet-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Update
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss update notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
