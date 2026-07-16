import { Badge } from '../ui/badge';
import { STATUS_COLORS, cn } from '../../lib/utils';

const EXTRA = {
  draft: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  published: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  archived: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  scheduled: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  new: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  contacted: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  converted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  active: STATUS_COLORS.active,
  disabled: STATUS_COLORS.inactive,
  expired: STATUS_COLORS.expired,
};

export function StatusBadge({ status }) {
  const key = String(status || 'draft').toLowerCase();
  return <Badge className={cn(EXTRA[key] || STATUS_COLORS.inactive)}>{status || 'draft'}</Badge>;
}
