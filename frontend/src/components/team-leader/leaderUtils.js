export { formatBudget, formatCurrency, STATUS_STYLES } from '../sales-manager/managerUtils';

export const QUOTE_STATUS_STYLES = {
  draft: 'bg-slate-500/15 text-slate-600 ring-slate-400/30',
  pending_approval: 'bg-amber-500/15 text-amber-800 ring-amber-400/30',
  sent: 'bg-sky-500/15 text-sky-700 ring-sky-400/30',
  viewed: 'bg-violet-500/15 text-violet-700 ring-violet-400/30',
  negotiation: 'bg-amber-500/15 text-amber-700 ring-amber-400/30',
  approved: 'bg-emerald-500/15 text-emerald-700 ring-emerald-400/30',
  rejected: 'bg-rose-500/15 text-rose-700 ring-rose-400/30',
};

export function formatFollowUpDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
