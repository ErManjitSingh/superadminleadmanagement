import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight } from 'lucide-react';
import { fetchGlobalAuditLog } from '../../services/leadEnterpriseApi';
import { Button } from '../ui/button';
import { compactTable, compactTh, compactTd } from '../ui/compactTable';

const ACTION_LABELS = {
  'lead.created': 'Created',
  'lead.updated': 'Updated',
  'lead.deleted': 'Deleted',
  'lead.restored': 'Restored',
  'lead.assigned': 'Assigned',
  'lead.merged': 'Merged',
  'lead.status_changed': 'Status Changed',
  'lead.call_note_added': 'Call Note',
};

export default function LeadAuditLogPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchGlobalAuditLog({ page, limit: 30, action: actionFilter || undefined });
      setRows(res?.data || []);
      setTotal(res?.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [actionFilter]);

  const pageCount = Math.max(1, Math.ceil(total / 30));

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-brand-600" />
            <h1 className="text-2xl font-bold text-content-primary">Audit Log</h1>
          </div>
          <p className="text-sm text-content-muted">Immutable field-level change history for leads</p>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-subtle bg-surface px-3 py-2 text-sm h-10 min-w-[180px]"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-subtle bg-surface p-16 text-center text-content-muted">Loading...</div>
      ) : !rows.length ? (
        <div className="rounded-2xl border border-subtle bg-surface p-12 text-center text-content-muted">No audit entries</div>
      ) : (
        <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className={compactTable}>
              <thead>
                <tr className="border-b border-subtle bg-surface-elevated/50">
                  {['When', 'Action', 'Actor', 'Changes', ''].map((h) => (
                    <th key={h || 'a'} className={compactTh}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {rows.map((row) => {
                  const changes = (row.changes || []).slice(0, 2);
                  const changeText = changes.length
                    ? changes.map((c) => `${c.field}: ${c.oldValue ?? '—'} → ${c.newValue ?? '—'}`).join('; ')
                    : row.meta?.outcome || '—';
                  return (
                    <tr key={row._id} className="hover:bg-brand-500/[0.03]">
                      <td className={`${compactTd} whitespace-nowrap text-content-secondary`}>
                        {row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className={compactTd}>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-700">
                          {ACTION_LABELS[row.action] || row.action}
                        </span>
                      </td>
                      <td className={compactTd}>{row.actorName || 'System'}</td>
                      <td className={`${compactTd} max-w-[280px] truncate text-content-muted text-xs`} title={changeText}>
                        {changeText}
                      </td>
                      <td className={compactTd}>
                        {row.entityId && (
                          <Link to={`/leads/${row.entityId}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                              Lead <ChevronRight className="w-3.5 h-3.5" />
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
