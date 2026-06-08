import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { fetchSlaAnalytics } from '../../services/leadEnterpriseApi';
import { Button } from '../ui/button';
import { compactTable, compactTh, compactTd } from '../ui/compactTable';
import LeadStatusBadge from '../leads/LeadStatusBadge';

const TABS = [
  { key: 'breached', label: 'Breached', icon: AlertTriangle, color: 'text-rose-600 bg-rose-500/10' },
  { key: 'at_risk', label: 'At Risk', icon: Clock, color: 'text-amber-600 bg-amber-500/10' },
  { key: 'pending', label: 'Pending', icon: Clock, color: 'text-brand-600 bg-brand-500/10' },
  { key: 'met', label: 'Met', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-500/10' },
];

export default function SlaDashboardPage() {
  const [tab, setTab] = useState('breached');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSlaAnalytics({ tab, page, limit: 20 });
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab]);

  const counts = data?.counts || {};
  const rows = data?.data || [];
  const pageCount = Math.max(1, Math.ceil((data?.pagination?.total || 0) / 20));

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">SLA Monitor</h1>
        <p className="text-sm text-content-muted mt-1">
          15-minute first-contact SLA — track breaches and at-risk leads
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                active ? 'border-brand-500/40 bg-brand-500/5 ring-1 ring-brand-500/20' : 'border-subtle bg-surface hover:bg-surface-elevated/50'
              }`}
            >
              <div className={`inline-flex p-2 rounded-xl ${t.color} mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-content-primary">{counts[t.key === 'at_risk' ? 'atRisk' : t.key] ?? 0}</p>
              <p className="text-xs text-content-muted">{t.label}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-subtle bg-surface p-16 text-center text-content-muted">Loading...</div>
      ) : !rows.length ? (
        <div className="rounded-2xl border border-subtle bg-surface p-12 text-center text-content-muted">
          No {tab.replace('_', ' ')} leads
        </div>
      ) : (
        <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className={compactTable}>
              <thead>
                <tr className="border-b border-subtle bg-surface-elevated/50">
                  {['Customer', 'Phone', 'Executive', 'Created', 'Status', 'SLA', ''].map((h) => (
                    <th key={h || 'a'} className={compactTh}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {rows.map((lead) => (
                  <tr key={lead._id} className="hover:bg-brand-500/[0.03]">
                    <td className={`${compactTd} font-medium`}>{lead.name}</td>
                    <td className={compactTd}>{lead.phone}</td>
                    <td className={compactTd}>{lead.assignedTo?.name || 'Unassigned'}</td>
                    <td className={compactTd}>
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className={compactTd}><LeadStatusBadge status={lead.status} size="sm" /></td>
                    <td className={compactTd}>
                      {lead.slaStatus === 'breached' && (
                        <span className="text-xs font-semibold text-rose-600">{lead.minutesOverdue}m overdue</span>
                      )}
                      {lead.slaStatus === 'at_risk' && (
                        <span className="text-xs font-semibold text-amber-600">{lead.minutesLeft}m left</span>
                      )}
                      {lead.slaStatus === 'met' && (
                        <span className="text-xs font-semibold text-emerald-600">Contacted</span>
                      )}
                      {lead.slaStatus === 'pending' && (
                        <span className="text-xs text-content-muted">{lead.minutesLeft}m left</span>
                      )}
                    </td>
                    <td className={compactTd}>
                      <Link to={`/leads/${lead._id}`}>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-subtle text-sm">
              <span className="text-content-muted">Page {page} of {pageCount}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
