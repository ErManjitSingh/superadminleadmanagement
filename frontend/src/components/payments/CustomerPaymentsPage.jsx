import { useMemo, useState } from 'react';
import {
  Banknote,
  Check,
  FileText,
  History,
  IndianRupee,
  Mail,
  MessageCircle,
  Receipt,
  Search,
  Users,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { FilterChip, FinanceKpiCard, PaymentProgressBar, StatusBadge } from './paymentsUi';
import { formatDate, formatINRFull, METHOD_LABELS } from './paymentsUtils';
import { useCustomerPayments } from './useCustomerPayments';
import { usePaymentsUi } from './PaymentsContext';
import AddBookingPaymentModal from './AddBookingPaymentModal';
import { resendPaymentReceipt, sendPaymentReminder } from '../../services/bookingPaymentsApi';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const STATUSES = ['all', 'pending', 'partial', 'completed', 'overdue'];
const METHODS = ['all', 'upi', 'card', 'bank_transfer', 'cash', 'net_banking'];

const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  method: 'all',
  destination: 'all',
  executive: 'all',
  branch: 'all',
};

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function formatTravelRange(start, end) {
  if (!start) return '—';
  const s = formatDate(start);
  if (!end) return s;
  return `${s} – ${formatDate(end)}`;
}

export default function CustomerPaymentsPage() {
  const { user } = useAuth();
  const { openPayment } = usePaymentsUi();
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [applied, setApplied] = useState(DEFAULT_FILTERS);
  const [receiveBookingId, setReceiveBookingId] = useState(null);
  const [actionId, setActionId] = useState(null);

  const { payments, kpis, filterOptions, loading, reload } = useCustomerPayments(applied);

  const canReceivePayment = ['operations_manager', 'admin', 'accountant'].includes(user?.role);

  const destinations = useMemo(
    () => ['all', ...(filterOptions.destinations || [])],
    [filterOptions.destinations]
  );
  const executives = useMemo(
    () => ['all', ...(filterOptions.executives || [])],
    [filterOptions.executives]
  );
  const branches = useMemo(
    () => ['all', ...(filterOptions.branches || [])],
    [filterOptions.branches]
  );

  const trends = kpis.trends || {};

  const applyFilters = () => setApplied({ ...draft });
  const clearFilters = () => {
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
  };

  const handleSendReceipt = async (payment) => {
    if (!payment.lastPaymentId || !payment.bookingId) return;
    setActionId(`receipt-${payment.id}`);
    try {
      await resendPaymentReceipt(payment.bookingId, payment.lastPaymentId, 'both');
    } finally {
      setActionId(null);
    }
  };

  const handleWhatsApp = async (payment) => {
    if (payment.phone) {
      window.open(`https://wa.me/91${String(payment.phone).replace(/\D/g, '').slice(-10)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!payment.bookingId) return;
    setActionId(`wa-${payment.id}`);
    try {
      const result = await sendPaymentReminder(payment.bookingId, ['whatsapp']);
      if (result?.results?.waMeUrl) {
        window.open(result.results.waMeUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setActionId(null);
    }
  };

  const handleEmail = async (payment) => {
    if (payment.lastPaymentId && payment.bookingId) {
      setActionId(`email-${payment.id}`);
      try {
        await resendPaymentReceipt(payment.bookingId, payment.lastPaymentId, 'email');
      } finally {
        setActionId(null);
      }
      return;
    }
    if (!payment.bookingId) return;
    setActionId(`email-${payment.id}`);
    try {
      await sendPaymentReminder(payment.bookingId, ['email']);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Payments"
        description="Track every booking payment, installment, and receipt"
        breadcrumbs={['Payments', 'Customer Payments']}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <FinanceKpiCard
          label="Total Collection"
          value={kpis.totalCollection || 0}
          format="inr"
          icon={IndianRupee}
          gradient="from-violet-500 to-indigo-600"
          trend={trends.totalCollection}
          hint="vs last 7 days"
          index={0}
        />
        <FinanceKpiCard
          label="Received Amount"
          value={kpis.receivedAmount || 0}
          format="inr"
          icon={Wallet}
          gradient="from-emerald-500 to-teal-600"
          trend={trends.receivedAmount}
          hint="vs last 7 days"
          index={1}
        />
        <FinanceKpiCard
          label="Pending Amount"
          value={kpis.pendingAmount || 0}
          format="inr"
          icon={Clock}
          gradient="from-amber-500 to-orange-600"
          trend={trends.pendingAmount}
          hint="vs last 7 days"
          index={2}
        />
        <FinanceKpiCard
          label="Overdue Amount"
          value={kpis.overdueAmount || 0}
          format="inr"
          icon={AlertTriangle}
          gradient="from-rose-500 to-pink-600"
          trend={trends.overdueAmount}
          hint="vs last 7 days"
          index={3}
        />
        <FinanceKpiCard
          label="Completed Bookings"
          value={kpis.completedBookings || 0}
          icon={CheckCircle2}
          gradient="from-sky-500 to-blue-600"
          trend={trends.completedBookings}
          hint="vs last 7 days"
          index={4}
        />
        <FinanceKpiCard
          label="Partial Payments"
          value={kpis.partialPayments || 0}
          icon={Users}
          gradient="from-fuchsia-500 to-purple-600"
          trend={trends.partialPayments}
          hint="vs last 7 days"
          index={5}
        />
      </div>

      <div className="rounded-2xl border border-subtle bg-surface p-4 shadow-sm space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            value={draft.search}
            onChange={(e) => setDraft((f) => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Search customer, lead, quotation, invoice…"
            className="input-premium w-full pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <FilterChip key={s} active={draft.status === s} onClick={() => setDraft((f) => ({ ...f, status: s }))}>
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <FilterChip key={m} active={draft.method === m} onClick={() => setDraft((f) => ({ ...f, method: m }))}>
              {m === 'all' ? 'All Methods' : METHOD_LABELS[m] || m}
            </FilterChip>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectFilter label="Destination" value={draft.destination} options={destinations} onChange={(v) => setDraft((f) => ({ ...f, destination: v }))} />
          <SelectFilter label="Executive" value={draft.executive} options={executives} onChange={(v) => setDraft((f) => ({ ...f, executive: v }))} />
          <SelectFilter label="Branch" value={draft.branch} options={branches} onChange={(v) => setDraft((f) => ({ ...f, branch: v }))} />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white" onClick={applyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle bg-surface/50 px-6 py-16 text-center">
          <p className="font-semibold text-content-primary">No customer payments found</p>
          <p className="mt-1 text-sm text-content-muted">Convert leads with advance payment to see bookings here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm transition-all hover:shadow-md hover:border-violet-500/20"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
                    {initials(p.customerName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-content-primary">{p.customerName}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-content-muted">
                      Lead {p.leadCode} · Quotation {p.quoteNumber} · {p.packageName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(p.destinationTags || [p.destination]).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetaCell label="Travel Date" value={formatTravelRange(p.travelDate, p.returnDate)} />
                <MetaCell label="Travelers" value={`${p.adults || 0} Adults, ${p.children || 0} Child`} />
                <MetaCell label="Executive" value={p.executive} />
                <MetaCell label="Branch" value={p.branch} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MoneyCell label="Total Amount" value={p.total} />
                <MoneyCell label="Received Amount" value={p.received} tone="emerald" />
                <MoneyCell label="Pending Amount" value={p.pending} tone="amber" />
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[11px] text-content-muted">
                  <span>Payment Progress</span>
                  <span className="font-semibold">{p.progress ?? 0}%</span>
                </div>
                <PaymentProgressBar total={p.total} received={p.received} />
                {p.lastPaymentDate && (
                  <p className="mt-2 text-[11px] text-content-muted">
                    Last Payment: {formatDate(p.lastPaymentDate)}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-content-muted">
                  Payment Milestone Timeline
                </p>
                <MilestoneTimeline steps={p.milestones || p.timeline || []} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-subtle pt-4">
                {canReceivePayment && p.status !== 'completed' && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                    onClick={() => setReceiveBookingId(p.bookingId)}
                  >
                    <Banknote className="h-3.5 w-3.5" /> Receive Payment
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openPayment(p)}>
                  <FileText className="h-3.5 w-3.5" /> View Invoice
                </Button>
                {p.lastPaymentId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={actionId === `receipt-${p.id}`}
                    onClick={() => handleSendReceipt(p)}
                  >
                    <Receipt className="h-3.5 w-3.5" /> Send Receipt
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openPayment(p)}>
                  <History className="h-3.5 w-3.5" /> History
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-emerald-600"
                  disabled={actionId === `wa-${p.id}`}
                  onClick={() => handleWhatsApp(p)}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={actionId === `email-${p.id}`}
                  onClick={() => handleEmail(p)}
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AddBookingPaymentModal
        open={!!receiveBookingId}
        onClose={() => setReceiveBookingId(null)}
        bookingId={receiveBookingId}
        onSuccess={() => {
          setReceiveBookingId(null);
          reload();
        }}
      />
    </div>
  );
}

function MilestoneTimeline({ steps }) {
  if (!steps.length) return <p className="text-xs text-content-muted">No payment milestones yet</p>;

  const innerWidthPct = Math.max(100, (steps.length / 6) * 100);
  const stepWidthPct = 100 / steps.length;

  return (
    <div className="overflow-x-auto pb-2 scrollbar-thin">
      <div className="flex items-start" style={{ width: `${innerWidthPct}%`, minWidth: '100%' }}>
        {steps.map((step, i) => {
          const isPaid = step.state === 'paid';
          const isOverdue = step.state === 'overdue';
          const isPending = !isPaid;

          return (
            <div
              key={`${step.label}-${i}`}
              className="flex shrink-0 flex-col items-center px-2 text-center"
              style={{ width: `${stepWidthPct}%` }}
            >
              <div className="flex w-full items-center">
                {i > 0 && <div className="h-px flex-1 bg-subtle" />}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                    isPaid && 'border-emerald-500 bg-emerald-500 text-white',
                    isOverdue && 'border-rose-500 bg-rose-500/10 text-rose-600',
                    isPending && !isOverdue && 'border-amber-400 bg-amber-500/10 text-amber-600'
                  )}
                >
                  {isPaid ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                </div>
                {i < steps.length - 1 && <div className="h-px flex-1 bg-subtle" />}
              </div>
              <div className="mt-2 min-w-0 w-full">
                <p className="truncate text-xs font-semibold text-content-primary">{step.label}</p>
                <p className="text-sm font-bold metric-tabular text-content-primary">{formatINRFull(step.amount)}</p>
                <p className="text-[10px] text-content-muted">
                  {isPaid ? `Paid on ${formatDate(step.date)}` : `Due on ${formatDate(step.date)}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
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
    <div className="rounded-xl border border-subtle bg-surface-muted/30 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-content-muted">{label}</p>
      <p className={cn('mt-0.5 text-base font-bold metric-tabular', toneClass)}>{formatINRFull(value)}</p>
    </div>
  );
}

function MetaCell({ label, value }) {
  return (
    <div className="rounded-xl border border-subtle bg-surface-muted/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-content-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-content-primary">{value || '—'}</p>
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
