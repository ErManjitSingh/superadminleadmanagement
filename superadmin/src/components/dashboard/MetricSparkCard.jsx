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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:shadow-md dark:border-slate-700/50 dark:bg-slate-900/80">
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
        {change != null && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold',
              positive ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
