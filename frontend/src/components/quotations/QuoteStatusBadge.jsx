import { cn } from '../../lib/utils';
import { QUOTE_STATUSES } from './constants';

export default function QuoteStatusBadge({ status, className }) {
  const cfg = QUOTE_STATUSES.find((s) => s.value === status) || QUOTE_STATUSES[0];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize', cfg.color, className)}>
      {cfg.label}
    </span>
  );
}
