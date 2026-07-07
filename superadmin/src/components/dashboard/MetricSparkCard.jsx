import { TrendingDown, TrendingUp } from 'lucide-react';
import Sparkline from './Sparkline';
import { cn } from '../../lib/utils';

export default function MetricSparkCard({
  title,
  value,
  change,
  trendUp = true,
  icon: Icon,
  iconBg = 'bg-violet-500/15 text-violet-600',
  sparkData,
  sparkColor = '#6366f1',
}) {
  const positive = trendUp;
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:shadow-md dark:border-slate-700/50 dark:bg-slate-900/80">
      <div className="flex items-start justify-between gap-2">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
      <p className="mt-3 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
        {change != null && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold',
              positive ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
