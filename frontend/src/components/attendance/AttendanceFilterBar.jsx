import { motion } from 'framer-motion';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { ATTENDANCE_PRESETS } from './attendanceDateUtils';

export default function AttendanceFilterBar({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  rangeLabel,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-subtle bg-surface/90 backdrop-blur-xl shadow-sm overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-4 border-b border-subtle/80 bg-gradient-to-r from-brand-600/[0.06] via-transparent to-violet-500/[0.05]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-600/25">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                Time period
              </p>
              <p className="text-sm font-semibold text-content-primary leading-tight">{rangeLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-content-muted">
            <span className="hidden sm:inline">Asia/Kolkata</span>
            <span className="h-1 w-1 rounded-full bg-content-muted/40 hidden sm:inline" />
            <span className="font-medium text-content-secondary">Custom range</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {ATTENDANCE_PRESETS.map((p) => {
            const active = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange(p.id)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'text-white shadow-lg shadow-brand-600/30'
                    : 'text-content-secondary bg-surface-elevated/80 border border-subtle hover:border-brand-500/30 hover:text-content-primary'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="attendance-preset-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{p.label}</span>
              </button>
            );
          })}
        </div>

        <details className="group rounded-xl border border-subtle/80 bg-surface-elevated/40 open:bg-surface-elevated/60 transition-colors">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-content-secondary hover:text-content-primary [&::-webkit-details-marker]:hidden">
            <span>Pick specific dates</span>
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 flex flex-wrap items-end gap-3 border-t border-subtle/60 pt-3">
            <label className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">From</span>
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => onCustomFromChange(e.target.value)}
                className="input-premium h-10 rounded-xl text-sm w-full min-w-[150px]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">To</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => onCustomToChange(e.target.value)}
                className="input-premium h-10 rounded-xl text-sm w-full min-w-[150px]"
              />
            </label>
          </div>
        </details>
      </div>
    </motion.div>
  );
}
