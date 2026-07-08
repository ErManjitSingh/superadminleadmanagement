import { ArrowRight, ArrowUpCircle, RefreshCw, X } from 'lucide-react';
import { useAppVersionCheck } from '../hooks/useAppVersionCheck';
import { formatReleaseDate, formatVersionLabel } from '../lib/appVersion';
import { Button } from './ui/button';

export default function UpdateAvailableBanner() {
  const { updateAvailable, currentBuild, latestBuild, handleUpdate, handleDismiss } = useAppVersionCheck();

  if (!updateAvailable || !latestBuild) return null;

  const releaseDate = formatReleaseDate(latestBuild.builtAt);

  return (
    <div className="sticky top-0 z-50 border-b border-violet-300/40 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 px-4 py-3 text-white shadow-md shadow-violet-900/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm sm:mt-0">
            <ArrowUpCircle className="h-4.5 w-4.5" />
          </span>

          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold leading-tight tracking-tight">A new version is available</p>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-violet-100/95">
                {formatVersionLabel(currentBuild)}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-violet-200/80" aria-hidden />
              <span className="rounded-md border border-emerald-300/30 bg-emerald-400/15 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-50">
                {formatVersionLabel(latestBuild)}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-violet-100/85">
              {releaseDate
                ? `Released ${releaseDate}. Update now to load the latest improvements and fixes.`
                : 'Update now to load the latest improvements, features, and fixes.'}
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <Button
            size="sm"
            onClick={handleUpdate}
            className="flex-1 border-0 bg-white text-violet-700 shadow-sm hover:bg-violet-50 sm:flex-none"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Update now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-1 text-white/90 hover:bg-white/10 hover:text-white sm:flex-none"
          >
            Remind me later
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            className="hidden rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            aria-label="Dismiss update notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
