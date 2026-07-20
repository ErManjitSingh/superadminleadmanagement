import { Trophy, Check } from 'lucide-react';
import { normalizeLeadStatus } from '../../utils/leadUtils';
import { PIPELINE_STAGES } from './leadDetailData';
import { DETAIL_CARD } from './leadDetailUtils';
import { cn } from '../../lib/utils';

export default function LeadStatusPipeline({ status, embedded = false, className = '' }) {
  const current = normalizeLeadStatus(status);
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.value === current);

  return (
    <div className={cn(!embedded && DETAIL_CARD, !embedded && 'p-4 sm:p-5 mb-5', embedded && 'mb-0', className)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-5">
        Lead Pipeline
      </p>
      <div className="flex items-start overflow-x-auto gap-0 pb-1 scrollbar-thin">
        {PIPELINE_STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = stage.value === current;
          const isConverted = stage.value === 'converted';
          const isBooked = stage.value === 'booked_from_another_company';
          const completedOrActive = done || active;

          return (
            <div key={stage.value} className="flex items-start flex-1 min-w-[70px]">
              <div className="flex flex-col items-center flex-1 px-0.5">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all shrink-0',
                    active && !isConverted && 'bg-[#4f46e5] border-[#4f46e5] text-white shadow-lg shadow-indigo-500/30 ring-[6px] ring-indigo-100',
                    active && isConverted && 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30',
                    done && 'bg-indigo-100 border-indigo-300 text-indigo-600',
                    !completedOrActive && 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700'
                  )}
                >
                  {(isConverted || isBooked) && active ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : isConverted && done ? (
                    <Trophy className="w-3.5 h-3.5" />
                  ) : (
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        active ? 'bg-white' : done ? 'bg-indigo-500' : 'bg-slate-300'
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[9px] sm:text-[10px] mt-2.5 font-semibold text-center leading-tight max-w-[82px]',
                    active ? 'text-indigo-700 dark:text-indigo-300' : done ? 'text-slate-600' : 'text-slate-400'
                  )}
                >
                  {stage.shortLabel || stage.label}
                </span>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div
                  className={cn(
                    'h-0 mt-4 flex-1 min-w-[8px] max-w-[32px] border-t-2',
                    i < currentIdx
                      ? 'border-solid border-indigo-400'
                      : 'border-dashed border-slate-300 dark:border-slate-600'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
