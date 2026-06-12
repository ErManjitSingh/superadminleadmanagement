import { cn } from '../../../lib/utils';

export default function OperationsFilterTabs({ options, value, onChange, className }) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap gap-1 p-1 rounded-2xl border border-subtle/80 bg-surface-elevated/50 shadow-sm',
        className,
      )}
    >
      {options.map(({ value: optValue, label, icon: Icon }) => {
        const active = value === optValue;
        return (
          <button
            key={optValue || 'all'}
            type="button"
            onClick={() => onChange(optValue)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 capitalize',
              active
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                : 'text-content-muted hover:text-content-primary hover:bg-surface/80',
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
