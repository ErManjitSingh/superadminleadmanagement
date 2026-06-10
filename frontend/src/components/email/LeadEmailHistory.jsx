import { useEffect, useState } from 'react';
import { Mail, CheckCircle2, XCircle, Clock, Reply, RefreshCw } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchLeadEmailHistory } from '../../services/emailApi';
import API from '../../api/axios';

const STATUS_ICON = {
  sent: CheckCircle2,
  failed: XCircle,
  queued: Clock,
  received: Reply,
};

const STATUS_CLASS = {
  sent: 'text-emerald-600 bg-emerald-500/10',
  failed: 'text-red-600 bg-red-500/10',
  queued: 'text-amber-600 bg-amber-500/10',
  received: 'text-violet-600 bg-violet-500/10',
};

export default function LeadEmailHistory({ leadId, emailEndpoint = '/leads', refreshKey }) {
  const { can } = usePermissions();
  const canSend = can('email', 'send');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = () => {
    if (!leadId || !canSend) return;
    setLoading(true);
    fetchLeadEmailHistory(leadId, emailEndpoint)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [leadId, emailEndpoint, canSend, refreshKey]);

  const syncReplies = async () => {
    setSyncing(true);
    try {
      await API.post('/emails/sync-replies', {}, { skipSuccessToast: false });
      load();
    } catch {
      /* toast handled */
    } finally {
      setSyncing(false);
    }
  };

  if (!canSend) return null;

  return (
    <div className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-sky-600" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-content-muted">Email History</h3>
        </div>
        <button
          type="button"
          onClick={syncReplies}
          disabled={syncing}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-600"
          title="Check inbox for client replies"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          Sync replies
        </button>
      </div>

      {loading && <p className="text-sm text-content-muted">Loading…</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-content-muted">No emails yet</p>
      )}

      <div className="space-y-3 max-h-[420px] overflow-y-auto overscroll-contain pr-1">
        {rows.map((row) => {
          const isInbound = row.direction === 'inbound';
          const Icon = STATUS_ICON[row.status] || (isInbound ? Reply : Clock);
          const tone = STATUS_CLASS[row.status] || (isInbound ? STATUS_CLASS.received : STATUS_CLASS.queued);

          return (
            <div key={row._id}>
              <div className={`flex gap-3 p-3 rounded-xl border bg-surface-elevated/40 ${isInbound ? 'border-violet-500/25 bg-violet-500/5' : 'border-subtle'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-content-primary truncate">{row.subject}</p>
                    {isInbound && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-violet-700 bg-violet-500/15 px-1.5 py-0.5 rounded">Client reply</span>
                    )}
                  </div>
                  <p className="text-xs text-content-muted mt-0.5 truncate">
                    {isInbound ? `From: ${row.fromEmail || row.sentBy}` : `To: ${(row.to || []).join(', ')}`}
                  </p>
                  {row.snippet && (
                    <p className="text-xs text-content-secondary mt-2 leading-relaxed line-clamp-3 bg-white/50 dark:bg-surface/50 rounded-lg p-2 border border-subtle/60">
                      “{row.snippet}”
                    </p>
                  )}
                  <p className="text-xs text-content-muted mt-1.5">
                    {row.sentBy} · {new Date(row.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {(row.replies || []).map((reply) => (
                <div key={reply._id} className="ml-6 mt-2 flex gap-3 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${STATUS_CLASS.received}`}>
                    <Reply className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-violet-800">Client replied</p>
                    {reply.snippet && (
                      <p className="text-xs text-content-secondary mt-1 leading-relaxed line-clamp-4">“{reply.snippet}”</p>
                    )}
                    <p className="text-[11px] text-content-muted mt-1">
                      {reply.fromEmail} · {new Date(reply.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
