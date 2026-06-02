import { cn } from '../../../lib/utils';
import { BOOKING_STATUS_CONFIG } from '../constants';

export default function BookingStatusBadge({ status }) {
  const cfg = BOOKING_STATUS_CONFIG[status] || BOOKING_STATUS_CONFIG.pending;
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset', cfg.className)}>
      {cfg.label}
    </span>
  );
}
