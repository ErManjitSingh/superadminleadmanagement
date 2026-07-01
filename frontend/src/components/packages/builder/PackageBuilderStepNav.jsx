import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { PACKAGE_BUILDER_STEPS } from './packageBuilderConstants';

export default function PackageBuilderStepNav({ step, onStepChange, maxReached }) {
  return (
    <nav className="space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
      {PACKAGE_BUILDER_STEPS.map((s) => {
        const Icon = s.icon;
        const done = s.id < step;
        const active = s.id === step;
        const reachable = s.id <= maxReached;
        return (
          <button
            key={s.id}
            type="button"
            disabled={!reachable}
            onClick={() => reachable && onStepChange(s.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all',
              active && 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-400/30 shadow-sm',
              !active && reachable && 'hover:bg-white/50 dark:hover:bg-slate-800/50',
              !reachable && 'opacity-35 cursor-not-allowed'
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px]',
                done && 'bg-emerald-500 text-white',
                active && !done && 'bg-amber-600 text-white',
                !done && !active && 'bg-slate-200/80 dark:bg-slate-700 text-content-muted'
              )}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <p className={cn('text-[11px] font-bold truncate', active && 'text-amber-800 dark:text-amber-200')}>
                {s.title}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
