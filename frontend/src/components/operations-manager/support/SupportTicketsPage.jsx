import { useEffect, useState } from 'react';
import { Headphones, CheckCircle2 } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import { TICKET_STATUS_CONFIG } from '../constants';
import { formatDate } from '../operationsUtils';
import { cn } from '../../../lib/utils';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTickets = () => {
    setLoading(true);
    API.get('/operations-manager/tickets', { params: { status: filter || undefined } })
      .then((r) => setTickets(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  const updateStatus = async (id, status) => {
    await API.put(`/operations-manager/tickets/${id}`, { status });
    fetchTickets();
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Support Tickets" description="Customer support during trip execution" breadcrumbs={['Operations', 'Support']} />

      <div className="flex flex-wrap gap-2">
        {['', 'open', 'in_progress', 'resolved'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border capitalize', filter === s ? 'bg-teal-600 text-white border-teal-600' : 'border-subtle text-content-muted')}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-16 text-center text-content-muted animate-pulse">Loading tickets...</div>
        ) : tickets.map((t) => (
          <div key={t._id} className="rounded-2xl border border-subtle bg-surface/80 p-5 hover:border-teal-500/15 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10"><Headphones className="w-5 h-5 text-rose-600" /></div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-content-muted">{t.ticketNumber}</span>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize', t.priority === 'high' ? 'bg-rose-500/15 text-rose-700' : 'bg-amber-500/15 text-amber-700')}>{t.priority}</span>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md', TICKET_STATUS_CONFIG[t.status]?.className)}>{TICKET_STATUS_CONFIG[t.status]?.label}</span>
                  </div>
                  <h3 className="font-bold text-content-primary mt-1">{t.subject}</h3>
                  <p className="text-sm text-content-muted mt-0.5">{t.customerName} · {t.bookingNumber} · {t.category}</p>
                  <p className="text-xs text-content-muted mt-1">Created {formatDate(t.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {t.status === 'open' && (
                  <Button size="sm" variant="outline" className="rounded-lg h-8" onClick={() => updateStatus(t._id, 'in_progress')}>Start</Button>
                )}
                {t.status !== 'resolved' && (
                  <Button size="sm" variant="emerald" className="rounded-lg h-8 gap-1" onClick={() => updateStatus(t._id, 'resolved')}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
