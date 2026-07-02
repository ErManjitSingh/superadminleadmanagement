import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { BUILDER_STEPS } from './builderConstants';

export default function BuilderStepNav({ step, onStepChange, maxReached, hiddenStepIds = [] }) {
  const steps = BUILDER_STEPS.filter((s) => !hiddenStepIds.includes(s.id));
  return (
    <nav className="space-y-1">
      {steps.map((s) => {
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
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
              active && 'bg-gradient-to-r from-sky-500/20 to-indigo-500/10 border border-sky-400/30 shadow-sm',
              !active && reachable && 'hover:bg-white/50 dark:hover:bg-slate-800/50',
              !reachable && 'opacity-40 cursor-not-allowed'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                done && 'bg-emerald-500 text-white',
                active && !done && 'bg-sky-600 text-white',
                !done && !active && 'bg-slate-200/80 dark:bg-slate-700 text-content-muted'
              )}
            >
              {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <p className={cn('text-xs font-bold truncate', active && 'text-sky-700 dark:text-sky-300')}>
                {s.title}
              </p>
              <p className="text-[10px] text-content-muted">Step {s.id}</p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
