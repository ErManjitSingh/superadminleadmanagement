import { cn } from '../../lib/utils';
import { getStatusConfig } from './followupUtils';

export default function FollowUpStatusBadge({ status, className }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize', cfg.color, className)}>
      {cfg.label}
    </span>
  );
}
