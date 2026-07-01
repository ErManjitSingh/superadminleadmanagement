import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/input';
import { formatDate } from '../lib/utils';

const STATUS_COLORS = { open: 'bg-blue-500/15 text-blue-700', pending: 'bg-amber-500/15 text-amber-700', resolved: 'bg-emerald-500/15 text-emerald-700', closed: 'bg-slate-500/15 text-slate-700' };

export default function SupportPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['support', status],
    queryFn: () => superAdminApi.listSupportTickets({ status, limit: 50 }).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: body }) => superAdminApi.updateSupportTicket(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  });

  const rows = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Support Center" description="Platform support tickets from tenants — no CRM lead/booking data." />
      <Card className="p-4">
        <Select className="mb-4 w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>{['open','pending','resolved','closed'].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <div className="space-y-3">
          {isLoading ? <p>Loading…</p> : rows.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)]"><LifeBuoy className="mx-auto mb-2 h-8 w-8 opacity-40" />No tickets</div>
          ) : rows.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{t.subject}</p>
                  <p className="text-sm text-[var(--text-muted)]">{t.companyName} · {t.ticketNumber}</p>
                  <p className="mt-2 text-sm">{t.description}</p>
                </div>
                <Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.status !== 'resolved' && <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: t.id, data: { status: 'resolved' } })}>Resolve</Button>}
                {t.status !== 'closed' && <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: t.id, data: { status: 'closed' } })}>Close</Button>}
                <span className="text-xs text-[var(--text-muted)] self-center">{formatDate(t.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
