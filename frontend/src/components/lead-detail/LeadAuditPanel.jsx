import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { fetchLeadAudit } from '../../services/leadEnterpriseApi';
import LazySection from '../ui/LazySection';
import { DETAIL_STALE_MS, GC_TIME_MS } from '../../lib/queryConfig';

function AuditContent({ leadId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['lead-audit', leadId],
    queryFn: () => fetchLeadAudit(leadId, { limit: 20 }),
    staleTime: DETAIL_STALE_MS,
    gcTime: GC_TIME_MS,
  });

  const rows = data?.data || [];

  if (isLoading) return <p className="text-sm text-content-muted py-2">Loading...</p>;
  if (!rows.length) return <p className="text-sm text-content-muted py-2">No audit entries</p>;

  return (
    <ul className="space-y-3 max-h-64 overflow-y-auto pr-1 pt-3">
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
  );
}

export default function LeadAuditPanel({ leadId, canView = false }) {
  if (!canView) return null;

  return (
    <LazySection title="Audit Trail" subtitle="Field-level change history" icon={Shield}>
      <AuditContent leadId={leadId} />
    </LazySection>
  );
}
