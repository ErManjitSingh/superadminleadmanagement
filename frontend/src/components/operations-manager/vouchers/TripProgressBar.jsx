import { cn } from '../../../lib/utils';

const STAGE_COLORS = {
  done: 'bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-500',
  current: 'bg-gradient-to-r from-indigo-500 to-sky-500 border-indigo-400 ring-2 ring-indigo-400/40',
  pending: 'bg-slate-200/80 dark:bg-slate-700/50 border-slate-300/60',
};

export default function TripProgressBar({ progress }) {
  if (!progress?.stages?.length) return null;

  const percent = progress.percent ?? 0;

  return (
    <div className="rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-white/80 via-indigo-50/40 to-violet-50/30 dark:from-slate-900/80 dark:via-indigo-950/30 dark:to-violet-950/20 p-6 shadow-lg shadow-indigo-500/5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Trip Progress</p>
          <p className="text-lg font-black text-content-primary mt-0.5 capitalize">
            {(progress.currentStage || '').replace(/_/g, ' ')}
          </p>
        </div>
        <span className="text-2xl font-black tabular-nums text-indigo-600">{percent}%</span>
      </div>

      <div className="h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/50 overflow-hidden mb-5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {progress.stages.map((stage) => (
          <div
            key={stage.key}
            className={cn(
              'rounded-xl border px-2 py-2.5 text-center transition-all',
              stage.done ? STAGE_COLORS.done : stage.current ? STAGE_COLORS.current : STAGE_COLORS.pending,
            )}
          >
            <p className={cn(
              'text-[10px] font-bold leading-tight',
              stage.done || stage.current ? 'text-white' : 'text-content-muted',
            )}
            >
              {stage.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
