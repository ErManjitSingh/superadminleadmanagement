import { useEffect, useState } from 'react';
import { ArrowRightLeft, UserCheck, Building2 } from 'lucide-react';
import { fetchLeadTransferHistory } from '../../services/leadEnterpriseApi';

const TYPE_LABELS = {
  assign: 'Assigned',
  reassign: 'Reassigned',
  bulk_assign: 'Bulk Assigned',
  branch_transfer: 'Branch Transfer',
};

const TYPE_ICONS = {
  assign: UserCheck,
  reassign: UserCheck,
  bulk_assign: UserCheck,
  branch_transfer: Building2,
};

function formatEntry(row) {
  if (row.type === 'branch_transfer') {
    const from = row.fromBranchId?.name || row.fromBranchId?.code || 'Previous branch';
    const to = row.toBranchId?.name || row.toBranchId?.code || 'New branch';
    return `${from} → ${to}`;
  }
  const from = row.fromUserId?.name || 'Unassigned';
  const to = row.toUserId?.name || '—';
  return `${from} → ${to}`;
}

export default function LeadTransferHistory({ leadId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    fetchLeadTransferHistory(leadId)
      .then((res) => setRows(res?.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [leadId]);

  return (
    <div className="rounded-2xl border border-subtle bg-surface/80 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRightLeft className="w-4 h-4 text-content-muted" />
        <h3 className="text-sm font-semibold text-content-primary">Transfer History</h3>
      </div>

      {loading ? (
        <p className="text-sm text-content-muted">Loading...</p>
      ) : !rows.length ? (
        <p className="text-sm text-content-muted">No transfers recorded yet</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const Icon = TYPE_ICONS[row.type] || ArrowRightLeft;
            const when = row.createdAt
              ? new Date(row.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
              : '';
            return (
              <li key={row._id} className="flex gap-3 text-sm">
                <div className="p-1.5 rounded-lg bg-surface-elevated text-content-muted h-fit">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-content-primary">{TYPE_LABELS[row.type] || row.type}</p>
                  <p className="text-content-secondary truncate">{formatEntry(row)}</p>
                  <p className="text-xs text-content-muted mt-0.5">
                    {row.actorName || row.actorId?.name || 'System'} · {when}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
