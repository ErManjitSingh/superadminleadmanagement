import { FOLLOWUP_CATEGORIES } from './constants';
import { cn } from '../../lib/utils';

export default function FollowUpCategoryBadge({ category }) {
  const cfg = FOLLOWUP_CATEGORIES.find((c) => c.value === category) || FOLLOWUP_CATEGORIES[0];
  return (
    <span className={cn('inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset whitespace-nowrap', cfg.color)}>
      {cfg.label}
    </span>
  );
}
