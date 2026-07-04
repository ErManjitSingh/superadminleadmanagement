import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { BUILDER_STEPS } from './builderConstants';

/**
 * Horizontal progress stepper — matches Quotation Builder product UI.
 */
export default function BuilderStepNav({ step, onStepChange, maxReached, hiddenStepIds = [] }) {
  const steps = BUILDER_STEPS.filter((s) => !hiddenStepIds.includes(s.id));

  return (
    <nav className="w-full overflow-x-auto pb-1">
      <ol className="flex items-center min-w-[520px] sm:min-w-0">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const done = s.id < step;
          const active = s.id === step;
          const reachable = s.id <= maxReached;
          const isLast = index === steps.length - 1;

          return (
            <li key={s.id} className={cn('flex items-center', !isLast && 'flex-1')}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onStepChange(s.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 shrink-0 px-1',
                  reachable ? 'cursor-pointer' : 'cursor-not-allowed opacity-45',
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    done && 'bg-emerald-500 border-emerald-500 text-white',
                    active && !done && 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/25 ring-4 ring-violet-500/15',
                    !done && !active && 'bg-white border-slate-200 text-slate-400',
                  )}
                >
                  {done ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="text-center w-[4.5rem] sm:w-24">
                  <p
                    className={cn(
                      'text-[11px] sm:text-xs font-bold leading-tight',
                      active && 'text-violet-700',
                      done && !active && 'text-emerald-700',
                      !done && !active && 'text-slate-500',
                    )}
                  >
                    {s.title}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                    {s.subtitle}
                  </p>
                </div>
              </button>

              {!isLast && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1 sm:mx-2 rounded-full min-w-[12px] mb-6',
                    done ? 'bg-violet-500' : 'bg-slate-200',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
