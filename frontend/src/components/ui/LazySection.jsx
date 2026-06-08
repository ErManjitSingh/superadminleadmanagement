import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Collapsed by default — children mount only after expand (on-demand fetch). */
export default function LazySection({ title, subtitle, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-subtle bg-surface/80 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-elevated/40 transition-colors"
      >
        {Icon && (
          <div className="p-1.5 rounded-lg bg-surface-elevated text-content-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-content-primary">{title}</p>
          {subtitle && <p className="text-xs text-content-muted mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown className={cn('w-4 h-4 text-content-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="px-5 pb-5 border-t border-subtle">{children}</div>}
    </div>
  );
}
