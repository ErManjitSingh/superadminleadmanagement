import { motion } from 'framer-motion';
import { normalizeLeadStatus } from '../../utils/leadUtils';
import { PIPELINE_STAGES } from './leadDetailData';
import { cn } from '../../lib/utils';

export default function LeadStatusPipeline({ status }) {
  const current = normalizeLeadStatus(status);
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.value === current);

  return (
    <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-sm p-4 sm:p-5">
      <div className="flex items-center justify-between overflow-x-auto gap-2 pb-1 scrollbar-thin">
        {PIPELINE_STAGES.map((stage, i) => {
          const done = i <= currentIdx && currentIdx >= 0;
          const active = stage.value === current;
          return (
            <div key={stage.value} className="flex items-center flex-1 min-w-[72px]">
              <div className="flex flex-col items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{ scale: active ? 1.15 : 1 }}
                  className={cn(
                    'w-3 h-3 rounded-full border-2 transition-colors',
                    done ? 'bg-brand-600 border-brand-600' : 'bg-surface border-subtle',
                    active && 'ring-4 ring-brand-500/25'
                  )}
                />
                <span className={cn(
                  'text-[10px] mt-2 font-medium text-center leading-tight',
                  active ? 'text-brand-600' : done ? 'text-content-secondary' : 'text-content-muted'
                )}>
                  {stage.label}
                </span>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className={cn('h-0.5 flex-1 -mt-5 min-w-[12px]', i < currentIdx ? 'bg-brand-600' : 'bg-surface-elevated')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
