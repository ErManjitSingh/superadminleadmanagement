import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WIZARD_STEPS } from './constants';

export default function WizardStepProgress({ currentStep, onStepClick, maxReachable }) {
  const progress = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">Lead Wizard</p>
          <p className="text-sm font-medium text-content-primary mt-0.5">
            Step {currentStep} of {WIZARD_STEPS.length} — {WIZARD_STEPS[currentStep - 1]?.title}
          </p>
        </div>
        <span className="text-xs font-bold text-brand-600 bg-brand-500/10 px-2.5 py-1 rounded-full">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="relative h-1.5 rounded-full bg-surface-elevated overflow-hidden mb-5">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-600 to-violet-500"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      <div className="hidden lg:grid lg:grid-cols-7 gap-2">
        {WIZARD_STEPS.map((step) => {
          const Icon = step.icon;
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          const reachable = step.id <= maxReachable;
          return (
            <button
              key={step.id}
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onStepClick?.(step.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all text-center',
                reachable && 'cursor-pointer hover:bg-surface-elevated/60',
                !reachable && 'opacity-40 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center border transition-all',
                  done && 'bg-brand-600 border-brand-600 text-white',
                  active && !done && 'bg-brand-500/10 border-brand-500/40 text-brand-600 ring-2 ring-brand-500/20',
                  !done && !active && 'bg-surface-elevated border-subtle text-content-muted'
                )}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={cn('text-[10px] font-medium leading-tight', active ? 'text-brand-600' : 'text-content-muted')}>
                {step.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
