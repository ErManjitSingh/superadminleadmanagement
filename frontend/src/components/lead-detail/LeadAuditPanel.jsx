import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { fetchLeadAudit } from '../../services/leadEnterpriseApi';

export default function LeadAuditPanel({ leadId, canView = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leadId || !canView) return;
    setLoading(true);
    fetchLeadAudit(leadId, { limit: 15 })
      .then((res) => setRows(res?.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [leadId, canView]);

  if (!canView) return null;

  return (
    <div className="rounded-2xl border border-subtle bg-surface/80 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-content-muted" />
        <h3 className="text-sm font-semibold text-content-primary">Audit Trail</h3>
      </div>
      {loading ? (
        <p className="text-sm text-content-muted">Loading...</p>
      ) : !rows.length ? (
        <p className="text-sm text-content-muted">No audit entries</p>
      ) : (
        <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {rows.map((row) => (
            <li key={row._id} className="text-sm border-l-2 border-brand-500/30 pl-3">
              <p className="font-medium text-content-primary">{row.action?.replace(/\./g, ' ')}</p>
              {(row.changes || []).slice(0, 2).map((c, i) => (
                <p key={i} className="text-xs text-content-muted mt-0.5">
                  {c.field}: {String(c.oldValue ?? '—')} → {String(c.newValue ?? '—')}
                </p>
              ))}
              <p className="text-[10px] text-content-muted mt-1">
                {row.actorName} · {row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
