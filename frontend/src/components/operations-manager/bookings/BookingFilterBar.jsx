import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { BOOKING_STATUS_CONFIG } from '../constants';

const PENDING_STATUSES = ['booking_received', 'pending_verification', 'pending'];
const ACTIVE_STATUSES = ['in_progress'];

export default function BookingFilterBar({
  filters,
  onChange,
  onApply,
  onReset,
  destinations = [],
  packages = [],
  showStatusFilter = true,
  statusOptions = PENDING_STATUSES,
  searchPlaceholder = 'Search customer, booking #, destination...',
  activeCount = 0,
  singleDate = false,
}) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="mb-4 rounded-2xl border border-subtle bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-subtle bg-slate-50 text-sm text-content-primary placeholder:text-content-muted outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/40 transition-all"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-subtle bg-white text-sm font-medium text-content-primary hover:bg-slate-50 transition-colors lg:w-auto"
        >
          <SlidersHorizontal className="w-4 h-4 text-content-muted" />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 text-[10px] bg-blue-500 text-white rounded-full font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-3">
        {showStatusFilter && (
          <select
            value={filters.bookingStatus}
            onChange={(e) => set('bookingStatus', e.target.value)}
            className="h-10 rounded-xl border border-subtle bg-slate-50 px-3 text-sm text-content-primary outline-none focus:ring-2 focus:ring-blue-500/25 xl:w-44"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{BOOKING_STATUS_CONFIG[s]?.label || s}</option>
            ))}
          </select>
        )}
        <select
          value={filters.destination}
          onChange={(e) => set('destination', e.target.value)}
          className="h-10 rounded-xl border border-subtle bg-slate-50 px-3 text-sm text-content-primary outline-none focus:ring-2 focus:ring-blue-500/25 xl:w-44"
        >
          <option value="">All Destinations</option>
          {destinations.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={filters.package}
          onChange={(e) => set('package', e.target.value)}
          className="h-10 rounded-xl border border-subtle bg-slate-50 px-3 text-sm text-content-primary outline-none focus:ring-2 focus:ring-blue-500/25 xl:flex-1"
        >
          <option value="">All Packages</option>
          {packages.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => set('dateFrom', e.target.value)}
          className="h-10 rounded-xl border border-subtle bg-slate-50 px-3 text-sm text-content-primary outline-none focus:ring-2 focus:ring-blue-500/25 xl:w-40"
        />
        {!singleDate && (
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
            className="h-10 rounded-xl border border-subtle bg-slate-50 px-3 text-sm text-content-primary outline-none focus:ring-2 focus:ring-blue-500/25 xl:w-40"
          />
        )}
        <div className="flex gap-2 xl:shrink-0">
          <button
            type="button"
            onClick={onApply}
            className="h-10 px-5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-subtle bg-white text-content-muted hover:bg-slate-50 hover:text-content-primary transition-colors"
            title="Reset filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
