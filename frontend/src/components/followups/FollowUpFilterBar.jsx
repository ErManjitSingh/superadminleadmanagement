import { Search } from 'lucide-react';
import { FOLLOWUP_STATUSES, FOLLOWUP_PRIORITIES } from './constants';

export default function FollowUpFilterBar({ filters, onChange }) {
  return (
    <div className="sticky top-16 z-20 mb-4 rounded-2xl border border-subtle bg-surface/90 backdrop-blur-md p-3 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search customer, phone, destination..."
            className="input-premium w-full h-10 pl-10 rounded-xl text-sm"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="input-premium h-10 rounded-xl text-sm min-w-[140px]"
        >
          <option value="">All Statuses</option>
          {FOLLOWUP_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value })}
          className="input-premium h-10 rounded-xl text-sm min-w-[130px]"
        >
          <option value="">All Priorities</option>
          {FOLLOWUP_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select
          value={filters.executive}
          onChange={(e) => onChange({ ...filters, executive: e.target.value })}
          className="input-premium h-10 rounded-xl text-sm min-w-[160px]"
        >
          <option value="">All Executives</option>
          {['Priya Patel', 'Amit Kumar', 'Vikram Singh'].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}
