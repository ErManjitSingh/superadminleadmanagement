import { Library, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Toggle between picking a company catalog item vs entering a new one. */
export default function ExistingOrNewTabs({
  mode = 'existing',
  onChange,
  existingLabel = 'Existing',
  newLabel = 'Add New',
  existingCount,
  className,
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Tab
        active={mode === 'existing'}
        onClick={() => onChange('existing')}
        icon={Library}
        label={existingLabel}
        count={existingCount}
      />
      <Tab
        active={mode === 'new'}
        onClick={() => onChange('new')}
        icon={Plus}
        label={newLabel}
      />
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all',
        active
          ? 'bg-violet-50 border-violet-500 text-violet-800 shadow-sm shadow-violet-500/10'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white',
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {typeof count === 'number' && count > 0 && (
        <span
          className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
            active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
