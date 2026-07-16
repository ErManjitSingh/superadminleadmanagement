import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

export function MetricCard({ label, value, hint, className }) {
  return (
    <Card className={cn('p-5', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>}
    </Card>
  );
}
