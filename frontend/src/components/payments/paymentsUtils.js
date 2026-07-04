export function formatINR(n) {
  const num = Number(n || 0);
  if (Math.abs(num) >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)} Cr`;
  if (Math.abs(num) >= 1_00_000) return `₹${(num / 1_00_000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatINRFull(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function daysUntil(date) {
  if (!date) return null;
  const ms = new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function paymentProgress(total, received) {
  const t = Number(total) || 0;
  const r = Number(received) || 0;
  if (t <= 0) return 0;
  return Math.min(100, Math.round((r / t) * 100));
}

export const PAYMENT_STATUS = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25' },
  partial: { label: 'Partial', className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25' },
  completed: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' },
  paid: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' },
  overdue: { label: 'Overdue', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25' },
  refunded: { label: 'Refunded', className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/25' },
};

export const REFUND_STATUS = {
  requested: { label: 'Requested', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25' },
  approved: { label: 'Approved', className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25' },
  completed: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' },
  rejected: { label: 'Rejected', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25' },
};

export const LINK_STATUS = {
  active: { label: 'Active', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' },
  opened: { label: 'Opened', className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25' },
  paid: { label: 'Paid', className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25' },
  expired: { label: 'Expired', className: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/25' },
  copied: { label: 'Copied', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25' },
};

export const METHOD_LABELS = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  net_banking: 'Net Banking',
  razorpay: 'Razorpay',
  cashfree: 'Cashfree',
  stripe: 'Stripe',
};

export function priorityFromDays(daysLeft) {
  if (daysLeft == null) return { key: 'unknown', label: 'No due date', color: 'slate', bar: 'bg-slate-400' };
  if (daysLeft < 0) return { key: 'overdue', label: `${Math.abs(daysLeft)}d overdue`, color: 'rose', bar: 'bg-rose-500' };
  if (daysLeft <= 2) return { key: 'critical', label: `${daysLeft}d left`, color: 'orange', bar: 'bg-orange-500' };
  if (daysLeft <= 7) return { key: 'warn', label: `${daysLeft}d left`, color: 'amber', bar: 'bg-amber-500' };
  return { key: 'ok', label: `${daysLeft}d left`, color: 'emerald', bar: 'bg-emerald-500' };
}

export function priorityCardClass(color) {
  const map = {
    rose: 'from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30',
    orange: 'from-orange-500/15 via-orange-500/5 to-transparent border-orange-500/30',
    amber: 'from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30',
    emerald: 'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30',
    slate: 'from-slate-500/10 via-slate-500/5 to-transparent border-subtle',
  };
  return map[color] || map.slate;
}

export function normalizeApiPayment(p) {
  if (!p) return null;
  const total = Number(p.amount) || 0;
  const received = Number(p.paidAmount) || 0;
  const pending = Math.max(0, total - received);
  let status = p.status || 'pending';
  if (status === 'paid') status = 'completed';
  if (status === 'pending' && p.dueDate && new Date(p.dueDate) < new Date() && pending > 0) {
    status = 'overdue';
  }
  return {
    id: p._id || p.id,
    customerName: p.customerName,
    leadId: p.lead?._id || p.lead || '—',
    leadCode: p.lead?.leadCode || p.lead?.name || '—',
    quotationId: p.quotation?._id || p.quotation || '—',
    quoteNumber: p.quotation?.quoteNumber || p.invoiceNumber,
    packageName: p.lead?.destination ? `${p.lead.destination} Package` : 'Travel Package',
    destination: p.lead?.destination || '—',
    executive: p.createdBy?.name || '—',
    branch: 'Head Office',
    total,
    received,
    pending,
    status,
    method: p.method || 'bank_transfer',
    dueDate: p.dueDate,
    paidAt: p.paidAt,
    invoiceNumber: p.invoiceNumber,
    phone: p.lead?.phone,
    email: p.lead?.email,
    timeline: buildDefaultTimeline(total, received),
    refunds: (p.refunds || []).map((r, i) => ({
      id: r._id || `rf-${i}`,
      amount: r.amount,
      reason: r.reason,
      date: r.date,
      status: 'completed',
    })),
    notes: [],
    invoices: [{ no: p.invoiceNumber, type: 'Tax Invoice', amount: total, status: status === 'completed' ? 'paid' : 'open' }],
    receipts: received > 0 ? [{ no: `RCP-${p.invoiceNumber}`, amount: received, date: p.paidAt || p.updatedAt }] : [],
    transactions: received > 0
      ? [{ id: `txn-${p._id}`, amount: received, method: p.method, date: p.paidAt || p.updatedAt, ref: p.invoiceNumber, status: 'success' }]
      : [],
    source: 'api',
    raw: p,
  };
}

function buildDefaultTimeline(total, received) {
  const booking = Math.round(total * 0.3);
  const second = Math.round(total * 0.5);
  const final = Math.max(0, total - booking - second);
  let remaining = received;
  const steps = [
    { label: 'Booking Amount', amount: booking },
    { label: 'Second Installment', amount: second },
    { label: 'Final Payment', amount: final },
  ];
  return steps.map((s) => {
    const paid = Math.min(remaining, s.amount);
    remaining = Math.max(0, remaining - paid);
    let state = 'pending';
    if (paid >= s.amount) state = 'paid';
    else if (paid > 0) state = 'partial';
    return { ...s, paid, state };
  });
}
