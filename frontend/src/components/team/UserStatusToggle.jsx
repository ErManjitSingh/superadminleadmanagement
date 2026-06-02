import { cn } from '../../lib/utils';

export default function UserStatusToggle({
  active = false,
  disabled = false,
  loading = false,
  onChange,
  size = 'md',
}) {
  const sizes = {
    sm: { track: 'w-9 h-5', thumb: 'w-4 h-4', on: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', on: 'translate-x-5' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled || loading}
      onClick={() => !disabled && !loading && onChange?.(!active)}
      className={cn(
        'relative inline-flex shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 focus:ring-offset-surface',
        s.track,
        active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        !disabled && !loading && 'cursor-pointer'
      )}
      title={active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-white shadow-md transition-transform duration-200',
          s.thumb,
          active ? s.on : 'translate-x-0.5',
          loading && 'opacity-80'
        )}
      />
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </span>
      )}
    </button>
  );
}
