import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-700/50', className)} {...props} />;
}

export function MetricSkeleton() {
  return (
    <div className="glass-card p-5">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}
