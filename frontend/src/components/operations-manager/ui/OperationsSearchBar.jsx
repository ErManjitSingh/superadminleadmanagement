import { Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function OperationsSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}) {
  return (
    <div className={cn('relative max-w-md', className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-premium w-full h-11 pl-10 pr-4 rounded-2xl text-sm border-subtle/80 bg-surface/80 shadow-sm focus:ring-2 focus:ring-teal-500/20"
      />
    </div>
  );
}
