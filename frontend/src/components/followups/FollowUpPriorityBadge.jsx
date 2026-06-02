import { cn } from '../../lib/utils';
import { getPriorityConfig } from './followupUtils';

export default function FollowUpPriorityBadge({ priority, className }) {
  const cfg = getPriorityConfig(priority || 'medium');
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize', cfg.color, className)}>
      {cfg.label}
    </span>
  );
}
