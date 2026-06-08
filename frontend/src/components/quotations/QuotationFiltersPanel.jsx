import { Filter, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { DESTINATIONS } from '../leads/constants';
import { cn } from '../../lib/utils';

export default function QuotationFiltersPanel({
  filters,
  onChange,
  onApply,
  onClear,
  onRefresh,
  hasActiveFilters = false,
  showStatusFilter = false,
  showExecutiveFilter = false,
  statusOptions = [],
  executives = [],
  segmentLabel,
  className,
}) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className={cn('rounded-2xl border border-indigo-500/20 bg-surface/80 p-4 space-y-4 shadow-sm', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-content-primary">
          <Filter className="w-4 h-4 text-indigo-600" />
          Filters
          {segmentLabel && (
            <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 ring-1 ring-indigo-500/25">
              {segmentLabel}
            </span>
          )}
          {hasActiveFilters && (
            <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/25">
              Active
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="h-8 gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          )}
          {hasActiveFilters && onClear && (
            <Button variant="ghost" size="sm" onClick={onClear} className="h-8 gap-1 text-content-muted">
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-2 xl:col-span-2">
          <Search className="w-4 h-4 text-indigo-600/70 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search quote #, customer, destination…"
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-indigo-500/20 bg-surface text-sm outline-none focus:ring-2 focus:ring-indigo-500/35"
          />
        </div>

        {showStatusFilter && (
          <label className="block">
            <span className="text-[10px] uppercase font-medium text-content-muted mb-1 block">Status</span>
            <select
              value={filters.status}
              onChange={(e) => set('status', e.target.value)}
              className="input-premium h-10 w-full"
            >
              {statusOptions.map((s) => (
                <option key={s.value || 'all'} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="text-[10px] uppercase font-medium text-content-muted mb-1 block">Destination</span>
          <select
            value={filters.destination}
            onChange={(e) => set('destination', e.target.value)}
            className="input-premium h-10 w-full"
          >
            <option value="">All destinations</option>
            {DESTINATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        {showExecutiveFilter && (
          <label className="block">
            <span className="text-[10px] uppercase font-medium text-content-muted mb-1 block">Executive</span>
            <select
              value={filters.executiveId}
              onChange={(e) => set('executiveId', e.target.value)}
              className="input-premium h-10 w-full"
            >
              <option value="">All executives</option>
              {executives.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.name}</option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="text-[10px] uppercase font-medium text-content-muted mb-1 block">From date</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set('dateFrom', e.target.value)}
            className="input-premium h-10 w-full"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase font-medium text-content-muted mb-1 block">To date</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
            className="input-premium h-10 w-full"
          />
        </label>
      </div>

      {onApply && (
        <div className="flex justify-end pt-1">
          <Button size="sm" onClick={onApply} className="h-9 px-4 rounded-xl">
            Apply filters
          </Button>
        </div>
      )}
    </div>
  );
}
