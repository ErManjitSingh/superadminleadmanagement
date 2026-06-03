export function formatCurrency(n) {
  if (!n && n !== 0) return '—';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatBudget(n) {
  return formatCurrency(n);
}

export const STATUS_STYLES = {
  new: 'bg-gradient-to-r from-sky-500/20 to-blue-500/15 text-sky-700 dark:text-sky-300 ring-sky-400/35',
  contacted: 'bg-gradient-to-r from-violet-500/20 to-purple-500/15 text-violet-700 dark:text-violet-300 ring-violet-400/35',
  follow_up: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/15 text-amber-700 dark:text-amber-300 ring-amber-400/35',
  quotation_sent: 'bg-gradient-to-r from-indigo-500/20 to-blue-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-400/35',
  negotiation: 'bg-gradient-to-r from-orange-500/20 to-amber-500/15 text-orange-700 dark:text-orange-300 ring-orange-400/35',
  reactivated: 'bg-gradient-to-r from-teal-500/20 to-cyan-500/15 text-teal-700 dark:text-teal-300 ring-teal-400/35',
  active: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-400/35',
  converted: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-400/35',
  lost: 'bg-gradient-to-r from-rose-500/15 to-slate-500/10 text-rose-600 dark:text-rose-300 ring-rose-400/30',
};
