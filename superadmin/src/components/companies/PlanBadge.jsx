import { cn } from '../../lib/utils';

const PLAN_STYLES = {
  starter: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  professional: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  enterprise: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  pro: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  custom: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
};

export default function PlanBadge({ plan }) {
  const name = plan?.name || '—';
  const slug = (plan?.slug || name).toLowerCase();
  const style = PLAN_STYLES[slug] || 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', style)}>
      {name}
    </span>
  );
}
