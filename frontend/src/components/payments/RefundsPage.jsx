import { useMemo, useState } from 'react';
import { Check, RotateCcw, X, Play } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { FinanceKpiCard, FilterChip, RefundStatusBadge } from './paymentsUi';
import { DEMO_REFUNDS } from './paymentsDemoData';
import { formatINRFull } from './paymentsUtils';

export default function RefundsPage() {
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState(DEMO_REFUNDS);

  const counts = useMemo(
    () => ({
      requested: rows.filter((r) => r.status === 'requested').length,
      approved: rows.filter((r) => r.status === 'approved').length,
      completed: rows.filter((r) => r.status === 'completed').length,
      rejected: rows.filter((r) => r.status === 'rejected').length,
    }),
    [rows]
  );

  const filtered = status === 'all' ? rows : rows.filter((r) => r.status === status);

  const setStatusFor = (id, next) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refunds"
        description="Approve, reject, and process customer refunds"
        breadcrumbs={['Payments', 'Refunds']}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceKpiCard label="Refund Requested" value={counts.requested} icon={RotateCcw} gradient="from-amber-500 to-orange-600" index={0} />
        <FinanceKpiCard label="Refund Approved" value={counts.approved} icon={Check} gradient="from-sky-500 to-blue-600" index={1} />
        <FinanceKpiCard label="Refund Completed" value={counts.completed} icon={Check} gradient="from-emerald-500 to-teal-600" index={2} />
        <FinanceKpiCard label="Refund Rejected" value={counts.rejected} icon={X} gradient="from-rose-500 to-pink-600" index={3} />
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'requested', 'approved', 'completed', 'rejected'].map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
            {s === 'all' ? 'All refunds' : s.charAt(0).toUpperCase() + s.slice(1)}
          </FilterChip>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((r) => (
          <article key={r.id} className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-content-primary">{r.customer}</h3>
                <p className="text-xs text-content-muted">Booking {r.booking}</p>
              </div>
              <RefundStatusBadge status={r.status} />
            </div>
            <p className="mt-3 text-sm text-content-secondary">{r.reason}</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-content-muted">Refund amount</p>
                <p className="text-2xl font-bold metric-tabular text-content-primary">{formatINRFull(r.amount)}</p>
                <p className="text-xs text-content-muted">Mode · {r.mode}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {r.status === 'requested' && (
                <>
                  <Button size="sm" className="gap-1.5 bg-emerald-600 text-white" onClick={() => setStatusFor(r.id, 'approved')}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-rose-600" onClick={() => setStatusFor(r.id, 'rejected')}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </>
              )}
              {r.status === 'approved' && (
                <Button size="sm" className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white" onClick={() => setStatusFor(r.id, 'completed')}>
                  <Play className="h-3.5 w-3.5" /> Process
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
