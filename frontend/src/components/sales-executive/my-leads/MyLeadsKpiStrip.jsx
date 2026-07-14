import { motion } from 'framer-motion';
import { Users, Trophy, CalendarClock, Flame, IndianRupee, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../executiveUtils';

function compactBudget(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 0)}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`;
  return formatCurrency(n);
}

const CARDS = [
  {
    key: 'myLeads',
    label: 'Total Leads',
    sub: 'All time',
    icon: Users,
    accent: 'text-sky-600',
    iconWrap: 'bg-sky-500/10 text-sky-600',
    bar: 'from-sky-400 to-blue-500',
  },
  {
    key: 'convertedLeads',
    label: 'Converted',
    sub: 'This month',
    icon: Trophy,
    accent: 'text-emerald-600',
    iconWrap: 'bg-emerald-500/10 text-emerald-600',
    bar: 'from-emerald-400 to-teal-500',
    showTrend: true,
  },
  {
    key: 'todayFollowups',
    label: 'Pending Follow-up',
    sub: 'Requires action',
    icon: CalendarClock,
    accent: 'text-amber-600',
    iconWrap: 'bg-amber-500/10 text-amber-600',
    bar: 'from-amber-400 to-orange-500',
    badge: { text: 'Urgent', className: 'bg-rose-500 text-white' },
    badgeWhen: (v) => v > 0,
  },
  {
    key: 'hotLeads',
    label: 'Hot Leads',
    sub: 'High priority',
    icon: Flame,
    accent: 'text-violet-600',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    bar: 'from-violet-400 to-fuchsia-500',
    badge: { text: 'Hot', className: 'bg-violet-600 text-white' },
    badgeWhen: (v) => v > 0,
  },
  {
    key: 'totalBudget',
    label: 'Total Budget',
    sub: 'All leads',
    icon: IndianRupee,
    accent: 'text-cyan-600',
    iconWrap: 'bg-cyan-500/10 text-cyan-600',
    bar: 'from-cyan-400 to-sky-500',
    format: compactBudget,
  },
];

export default function MyLeadsKpiStrip({ kpis, trends, isLoading }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        const raw = kpis?.[card.key];
        const value = isLoading && raw == null ? '—' : card.format ? card.format(raw || 0) : (raw ?? 0);
        const trend = card.showTrend ? trends?.[card.key] : null;
        const showBadge = card.badge && card.badgeWhen?.(raw || 0);

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative overflow-hidden rounded-2xl border border-subtle bg-white dark:bg-slate-900/80 shadow-sm p-4"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.bar}`} />
            <div className="flex items-start justify-between gap-2">
              <div className={`inline-flex p-2 rounded-xl ${card.iconWrap}`}>
                <Icon className="w-4 h-4" />
              </div>
              {showBadge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${card.badge.className}`}>
                  {card.badge.text}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted mt-3">
              {card.label}
            </p>
            <p className={`text-2xl font-bold tabular-nums mt-0.5 ${card.accent}`}>{value}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-[11px] text-content-muted">{card.sub}</p>
              {trend && typeof trend.change === 'number' && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                    trend.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  <TrendingUp className={`w-3 h-3 ${trend.change < 0 ? 'rotate-180' : ''}`} />
                  {trend.change >= 0 ? '+' : ''}
                  {trend.change}%
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
