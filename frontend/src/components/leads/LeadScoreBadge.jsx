import { cn } from '../../lib/utils';

export default function LeadScoreBadge({ score, className }) {
  if (score == null || score === '') return null;
  const n = Number(score);
  const tier =
    n >= 75 ? 'bg-emerald-500/15 text-emerald-700 ring-emerald-400/30' :
    n >= 45 ? 'bg-sky-500/15 text-sky-700 ring-sky-400/30' :
    'bg-slate-500/15 text-slate-600 ring-slate-400/30';

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ring-1 ring-inset whitespace-nowrap',
        tier,
        className
      )}
      title="Smart lead score"
    >
      {n}
    </span>
  );
}
