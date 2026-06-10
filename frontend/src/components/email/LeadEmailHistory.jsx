import { useEffect, useState } from 'react';
import { Mail, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchLeadEmailHistory } from '../../services/emailApi';

const STATUS_ICON = {
  sent: CheckCircle2,
  failed: XCircle,
  queued: Clock,
};

const STATUS_CLASS = {
  sent: 'text-emerald-600 bg-emerald-500/10',
  failed: 'text-red-600 bg-red-500/10',
  queued: 'text-amber-600 bg-amber-500/10',
};

export default function LeadEmailHistory({ leadId, emailEndpoint = '/leads', refreshKey }) {
  const { can } = usePermissions();
  const canSend = can('email', 'send');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leadId || !canSend) return;
    setLoading(true);
    fetchLeadEmailHistory(leadId, emailEndpoint)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [leadId, emailEndpoint, canSend, refreshKey]);

  if (!canSend) return null;

  return (
    <div className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-4 h-4 text-sky-600" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-content-muted">Email History</h3>
      </div>

      {loading && <p className="text-sm text-content-muted">Loading…</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-content-muted">No emails sent yet</p>
      )}

      <div className="space-y-3">
        {rows.map((row) => {
          const Icon = STATUS_ICON[row.status] || Clock;
          return (
            <div key={row._id} className="flex gap-3 p-3 rounded-xl border border-subtle bg-surface-elevated/40">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${STATUS_CLASS[row.status] || STATUS_CLASS.queued}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-content-primary truncate">{row.subject}</p>
                <p className="text-xs text-content-muted mt-0.5 truncate">
                  To: {(row.to || []).join(', ')}
                </p>
                <p className="text-xs text-content-muted mt-1">
                  {row.sentBy} · {new Date(row.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
