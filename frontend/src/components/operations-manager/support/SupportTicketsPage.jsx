import { useEffect, useMemo, useState } from 'react';
import { Headphones, CheckCircle2, Plus } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import OperationsDataTable from '../ui/OperationsDataTable';
import OperationsFilterTabs from '../ui/OperationsFilterTabs';
import { TICKET_STATUS_CONFIG, ISSUE_CATEGORIES } from '../constants';
import { formatDate } from '../operationsUtils';
import { cn } from '../../../lib/utils';

const EMPTY_FORM = {
  subject: '',
  customerName: '',
  bookingNumber: '',
  category: 'general',
  priority: 'medium',
  description: '',
};

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

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

  const createTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await API.post('/operations-manager/tickets', { ...form, status: 'open' });
    setForm(EMPTY_FORM);
    setShowForm(false);
    fetchTickets();
    setSubmitting(false);
  };

  const columns = useMemo(() => [
    {
      key: 'ticket',
      header: 'Ticket',
      render: (t) => (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 shrink-0">
            <Headphones className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-content-muted">{t.ticketNumber}</span>
            <p className="font-semibold mt-0.5">{t.subject}</p>
          </div>
        </div>
      ),
    },
    { key: 'customerName', header: 'Customer' },
    { key: 'bookingNumber', header: 'Booking', className: 'font-mono text-xs' },
    {
      key: 'category',
      header: 'Category',
      className: 'capitalize',
      render: (t) => ISSUE_CATEGORIES[t.category] || t.category,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => (
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg capitalize', t.priority === 'high' ? 'bg-rose-500/15 text-rose-700' : 'bg-amber-500/15 text-amber-700')}>
          {t.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg', TICKET_STATUS_CONFIG[t.status]?.className)}>
          {TICKET_STATUS_CONFIG[t.status]?.label}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      className: 'text-xs text-content-muted whitespace-nowrap',
      render: (t) => formatDate(t.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {t.status === 'open' && (
            <Button size="sm" variant="outline" className="rounded-xl h-8" onClick={() => updateStatus(t._id, 'in_progress')}>Start</Button>
          )}
          {t.status !== 'resolved' && (
            <Button size="sm" variant="emerald" className="rounded-xl h-8 gap-1" onClick={() => updateStatus(t._id, 'resolved')}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
            </Button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader title="Support Tickets" description="Customer support during trip execution" breadcrumbs={['Operations', 'Support']} />
        <Button variant="teal" className="rounded-xl gap-2 shrink-0" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4" /> Raise Issue
        </Button>
      </div>

      {showForm && (
        <form onSubmit={createTicket} className="rounded-3xl border border-subtle/80 bg-surface/80 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-sm">
          <input required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Issue subject" className="input-premium h-10 rounded-xl text-sm sm:col-span-2" />
          <input required value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} placeholder="Customer name" className="input-premium h-10 rounded-xl text-sm" />
          <input value={form.bookingNumber} onChange={(e) => setForm((f) => ({ ...f, bookingNumber: e.target.value }))} placeholder="Booking number" className="input-premium h-10 rounded-xl text-sm" />
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-premium h-10 rounded-xl text-sm">
            {Object.entries(ISSUE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="input-premium h-10 rounded-xl text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the issue..." rows={3} className="input-premium rounded-xl text-sm resize-none sm:col-span-2" />
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" variant="teal" className="rounded-xl" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Issue'}</Button>
          </div>
        </form>
      )}

      <OperationsFilterTabs options={STATUS_FILTERS} value={filter} onChange={setFilter} />

      <OperationsDataTable
        columns={columns}
        data={tickets}
        loading={loading}
        emptyIcon={Headphones}
        emptyTitle="No support tickets"
        emptyDescription="Customer issues during trips will appear here."
        footer={tickets.length ? `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}` : undefined}
      />
    </div>
  );
}
