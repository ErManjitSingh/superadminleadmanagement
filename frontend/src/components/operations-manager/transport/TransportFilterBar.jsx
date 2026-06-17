import { Car, Download, Filter, Plane, RotateCcw, Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function TransportFilterBar({
  tab = 'cabs',
  onTabChange,
  filters,
  onChange,
  onApply,
  onReset,
  onExport,
  vehicleTypes = [],
  pickups = [],
  drops = [],
  statuses = [],
  activeCount = 0,
}) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="mb-4 rounded-2xl border border-subtle bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div
          className={cn(
            'inline-flex p-1 rounded-2xl border border-subtle/80 bg-slate-50 shrink-0',
          )}
        >
          {[
            { value: 'cabs', label: 'Cabs', icon: Car },
            { value: 'flights', label: 'Flights', icon: Plane },
          ].map(({ value, label, icon: Icon }) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onTabChange(value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  active
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'text-content-muted hover:text-content-primary',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder={
              tab === 'cabs'
                ? 'Search vehicles by name, pickup, drop...'
                : 'Search flights by airline, number, route...'
            }
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-subtle bg-slate-50 text-sm text-content-primary placeholder:text-content-muted outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/40 transition-all"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
            {activeCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full font-bold">
                {activeCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-subtle bg-white text-sm font-semibold text-content-primary hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-subtle bg-white text-content-muted hover:bg-slate-50 transition-colors"
            title="Reset filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {tab === 'cabs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <select
            value={filters.vehicleType}
            onChange={(e) => set('vehicleType', e.target.value)}
            className="h-10 rounded-xl border border-subtle bg-slate-50 px-3 text-sm text-content-primary outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            <option value="">All Vehicle Types</option>
            {vehicleTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={filters.pickup}
            onChange={(e) => set('pickup', e.target.value)}
            className="h-10 rounded-xl border border-subtle bg-slate-50 px-3 text-sm text-content-primary outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            <option value="">All Pickups</option>
            {pickups.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={filters.drop}
            onChange={(e) => set('drop', e.target.value)}
            className="h-10 rounded-xl border border-subtle bg-slate-50 px-3 text-sm text-content-primary outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            <option value="">All Drops</option>
            {drops.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => set('status', e.target.value)}
            className="h-10 rounded-xl border border-subtle bg-slate-50 px-3 text-sm text-content-primary outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            <option value="">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'on_trip' ? 'On Trip' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
