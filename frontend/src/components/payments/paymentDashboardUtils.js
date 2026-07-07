import { formatINRFull, METHOD_LABELS } from './paymentsUtils';

export const METHOD_CHART_COLORS = {
  bank_transfer: '#8B5CF6',
  upi: '#14B8A6',
  cash: '#F97316',
  card: '#3B82F6',
  net_banking: '#EC4899',
  cheque: '#6366F1',
  razorpay: '#06B6D4',
  cashfree: '#0EA5E9',
  stripe: '#A855F7',
};

const FALLBACK_COLORS = ['#8B5CF6', '#14B8A6', '#F97316', '#3B82F6', '#EC4899', '#6366F1'];

export function methodColor(name, index = 0) {
  const key = String(name || '').toLowerCase().replace(/\s+/g, '_');
  return METHOD_CHART_COLORS[key] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export function methodLabel(name) {
  const key = String(name || '').toLowerCase().replace(/\s+/g, '_');
  return METHOD_LABELS[key] || String(name || 'Other').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function pctChangeLabel(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) return c > 0 ? '+100%' : '0%';
  const pct = ((c - p) / p) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function changeType(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (c === p) return 'neutral';
  return c > p ? 'up' : 'down';
}

export function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildMonthlyPendingVsPaid(monthlyRevenue = []) {
  return monthlyRevenue.map((m) => ({
    month: m.month,
    paid: m.received || 0,
    pending: Math.max(0, (m.revenue || 0) - (m.received || 0)),
  }));
}

export function buildMethodSplitChart(methodSplit = []) {
  const total = methodSplit.reduce((s, m) => s + (m.value || 0), 0) || 1;
  return methodSplit
    .map((m, i) => ({
      ...m,
      name: methodLabel(m.name),
      rawName: m.name,
      color: methodColor(m.name, i),
      amount: m.value || 0,
      pct: Math.round(((m.value || 0) / total) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function formatKpiInr(value) {
  return formatINRFull(value);
}
