import { cn } from '../../lib/utils';

const styles = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  disabled: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
  invited: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
};

export default function UserStatusBadge({ status }) {
  const label = status === 'active' ? 'Active' : status === 'disabled' ? 'Disabled' : 'Invited';
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset capitalize', styles[status] || styles.active)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', status === 'active' ? 'bg-emerald-500' : status === 'disabled' ? 'bg-rose-500' : 'bg-amber-500')} />
      {label}
    </span>
  );
}
