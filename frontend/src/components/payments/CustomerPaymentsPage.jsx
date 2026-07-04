import { useMemo, useState } from 'react';
import {
  Banknote,
  FileText,
  History,
  Mail,
  MessageCircle,
  Receipt,
  Search,
} from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { FilterChip, PaymentProgressBar, StatusBadge } from './paymentsUi';
import { formatDate, formatINRFull, METHOD_LABELS } from './paymentsUtils';
import { useCustomerPayments } from './useCustomerPayments';
import { usePaymentsUi } from './PaymentsContext';
import { cn } from '../../lib/utils';

const STATUSES = ['all', 'pending', 'partial', 'completed', 'overdue'];
const METHODS = ['all', 'upi', 'card', 'bank_transfer', 'cash', 'net_banking'];

export default function CustomerPaymentsPage() {
  const { payments, loading } = useCustomerPayments();
  const { openPayment } = usePaymentsUi();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const [destination, setDestination] = useState('all');
  const [executive, setExecutive] = useState('all');
  const [branch, setBranch] = useState('all');

  const destinations = useMemo(() => ['all', ...new Set(payments.map((p) => p.destination).filter(Boolean))], [payments]);
  const executives = useMemo(() => ['all', ...new Set(payments.map((p) => p.executive).filter(Boolean))], [payments]);
  const branches = useMemo(() => ['all', ...new Set(payments.map((p) => p.branch).filter(Boolean))], [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (method !== 'all' && p.method !== method) return false;
      if (destination !== 'all' && p.destination !== destination) return false;
      if (executive !== 'all' && p.executive !== executive) return false;
      if (branch !== 'all' && p.branch !== branch) return false;
      if (!q) return true;
      return [p.customerName, p.leadCode, p.quoteNumber, p.packageName, p.invoiceNumber]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [payments, search, status, method, destination, executive, branch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Payments"
        description="Track every quotation payment, installment, and receipt"
        breadcrumbs={['Payments', 'Customer Payments']}
      />

      <div className="rounded-2xl border border-subtle bg-surface p-4 shadow-sm space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, lead, quotation, invoice…"
            className="input-premium w-full pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
              {s === 'all' ? 'All status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <FilterChip key={m} active={method === m} onClick={() => setMethod(m)}>
              {m === 'all' ? 'All methods' : METHOD_LABELS[m] || m}
            </FilterChip>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectFilter label="Destination" value={destination} options={destinations} onChange={setDestination} />
          <SelectFilter label="Executive" value={executive} options={executives} onChange={setExecutive} />
          <SelectFilter label="Branch" value={branch} options={branches} onChange={setBranch} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((p, index) => (
            <article
              key={p.id}
              className={cn(
                'group rounded-2xl border border-subtle bg-surface p-5 shadow-sm transition-all duration-300',
                'hover:-translate-y-0.5 hover:shadow-lg hover:border-violet-500/20'
              )}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => openPayment(p)} className="text-left">
                  <h3 className="text-lg font-bold text-content-primary group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {p.customerName}
                  </h3>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {p.leadCode} · {p.quoteNumber} · {p.packageName}
                  </p>
                </button>
                <StatusBadge status={p.status} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MoneyCell label="Total" value={p.total} />
                <MoneyCell label="Received" value={p.received} tone="emerald" />
                <MoneyCell label="Pending" value={p.pending} tone="amber" />
              </div>

              <PaymentProgressBar total={p.total} received={p.received} className="mt-4" />

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-content-muted">Payment timeline</p>
                <div className="flex gap-2">
                  {(p.timeline || []).map((step) => (
                    <div
                      key={step.label}
                      className={cn(
                        'flex-1 rounded-xl border px-2 py-2 text-center',
                        step.state === 'paid' && 'border-emerald-500/30 bg-emerald-500/10',
                        step.state === 'partial' && 'border-sky-500/30 bg-sky-500/10',
                        step.state === 'pending' && 'border-subtle bg-surface-muted/40'
                      )}
                    >
                      <p className="text-[10px] text-content-muted leading-tight">{step.label}</p>
                      <p className="mt-1 text-xs font-bold metric-tabular text-content-primary">{formatINRFull(step.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-[11px] text-content-muted">
                Due {formatDate(p.dueDate)} · {METHOD_LABELS[p.method] || p.method} · {p.executive} · {p.branch}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                  <Banknote className="h-3.5 w-3.5" /> Receive Payment
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openPayment(p)}>
                  <FileText className="h-3.5 w-3.5" /> View Invoice
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Receipt className="h-3.5 w-3.5" /> Send Receipt
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openPayment(p)}>
                  <History className="h-3.5 w-3.5" /> History
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MoneyCell({ label, value, tone }) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-content-primary';
  return (
    <div className="rounded-xl border border-subtle bg-surface-muted/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-content-muted">{label}</p>
      <p className={cn('mt-0.5 text-sm font-bold metric-tabular', toneClass)}>{formatINRFull(value)}</p>
    </div>
  );
}

function SelectFilter({ label, value, options, onChange }) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium text-content-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-premium w-full text-sm">
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'all' ? `All ${label.toLowerCase()}s` : opt}
          </option>
        ))}
      </select>
    </label>
  );
}
