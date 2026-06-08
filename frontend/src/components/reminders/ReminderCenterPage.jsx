import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { fetchReminderCounts, fetchReminders } from '../../services/leadEnterpriseApi';
import { formatFollowUpDate } from '../followups/followupUtils';
import { Button } from '../ui/button';
import { compactTable, compactTh, compactTd } from '../ui/compactTable';
import { DEFAULT_PAGE_SIZE } from '../ui/TablePagination';

const TABS = [
  { key: 'today', label: 'Today', icon: CalendarClock, color: 'text-brand-600 bg-brand-500/10' },
  { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-rose-600 bg-rose-500/10' },
  { key: 'missed', label: 'Missed', icon: AlertTriangle, color: 'text-amber-600 bg-amber-500/10' },
  { key: 'upcoming', label: 'Upcoming', icon: Clock, color: 'text-violet-600 bg-violet-500/10' },
];

export default function ReminderCenterPage() {
  const [tab, setTab] = useState('today');
  const [counts, setCounts] = useState({ today: 0, overdue: 0, missed: 0, upcoming: 0 });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [countRes, listRes] = await Promise.all([
        fetchReminderCounts(),
        fetchReminders({ tab, page, limit: DEFAULT_PAGE_SIZE }),
      ]);
      setCounts(countRes);
      setRows(listRes?.data || []);
      setTotal(listRes?.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  const pageCount = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Reminder Center</h1>
        <p className="text-sm text-content-muted mt-1">Today&apos;s follow-ups, overdue tasks, and escalations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count = counts[t.key] ?? 0;
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
              <p className="text-2xl font-bold text-content-primary">{count}</p>
              <p className="text-xs text-content-muted mt-0.5">{t.label}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-subtle bg-surface p-16 text-center text-content-muted">
          Loading reminders...
        </div>
      ) : !rows.length ? (
        <div className="rounded-2xl border border-subtle bg-surface p-12 text-center text-content-muted">
          No {tab} reminders
        </div>
      ) : (
        <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className={compactTable}>
              <thead>
                <tr className="border-b border-subtle bg-surface-elevated/50">
                  {['Customer', 'Phone', 'Executive', 'Scheduled', 'Type', 'Priority', ''].map((h) => (
                    <th key={h || 'action'} className={compactTh}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {rows.map((fu) => {
                  const lead = fu.lead || {};
                  const leadId = lead._id || fu.lead;
                  return (
                    <tr key={fu._id} className="hover:bg-brand-500/[0.03]">
                      <td className={`${compactTd} font-medium text-content-primary`}>{lead.name || '—'}</td>
                      <td className={`${compactTd} text-content-secondary`}>{lead.phone || '—'}</td>
                      <td className={compactTd}>{fu.assignedTo?.name || '—'}</td>
                      <td className={compactTd}>{formatFollowUpDate(fu.scheduledAt)}</td>
                      <td className={`${compactTd} capitalize`}>{(fu.type || 'call').replace(/_/g, ' ')}</td>
                      <td className={`${compactTd} capitalize`}>{fu.priority || 'medium'}</td>
                      <td className={compactTd}>
                        {leadId && (
                          <Link to={`/leads/${leadId}`}>
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                              View <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
