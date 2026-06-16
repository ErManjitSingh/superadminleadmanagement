import { motion } from 'framer-motion';
import { Users, CalendarClock, Flame, FileText, Trophy, IndianRupee, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../executiveUtils';

const cards = [
  { key: 'myLeads', label: 'My Leads', sub: 'Total leads', icon: Users, iconBg: 'bg-blue-500', sparkColor: '#3B82F6' },
  { key: 'todayFollowups', label: "Today's Follow-ups", sub: 'No follow-ups', subWhenZero: true, icon: CalendarClock, iconBg: 'bg-violet-500', sparkColor: '#8B5CF6' },
  { key: 'hotLeads', label: 'Hot Leads', sub: 'High priority', icon: Flame, iconBg: 'bg-orange-500', sparkColor: '#F97316' },
  { key: 'quotationsSent', label: 'Quotations Sent', sub: 'This month', icon: FileText, iconBg: 'bg-indigo-500', sparkColor: '#6366F1' },
  { key: 'convertedLeads', label: 'Converted Leads', sub: 'This month', icon: Trophy, iconBg: 'bg-emerald-500', sparkColor: '#10B981' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', sub: 'Won revenue', icon: IndianRupee, iconBg: 'bg-teal-500', sparkColor: '#14B8A6', format: formatCurrency },
];

function Sparkline({ color, seed = 1 }) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const y = 14 + Math.sin((i + seed) * 1.2) * 6 + (seed % 3) * 2;
    return `${i * 10},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 70 28" className="w-[70px] h-7" aria-hidden>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function TrendBadge({ trend }) {
  if (!trend) return null;
  const { change, period } = trend;
  const isUp = change > 0;
  const isDown = change < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const colorClass = isUp
    ? 'text-emerald-600 dark:text-emerald-400'
    : isDown
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-content-muted';

  return (
    <p className={`text-[11px] font-medium flex items-center gap-1 mt-2 ${colorClass}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>
        {isUp ? '↑' : isDown ? '↓' : '—'} {Math.abs(change)}% {period}
      </span>
    </p>
  );
}

export default function ExecutiveKpiCards({ kpis, trends }) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map(({ key, label, sub, subWhenZero, icon: Icon, iconBg, sparkColor, format }, i) => {
        const value = kpis[key];
        const displaySub = subWhenZero && !value ? 'No follow-ups' : sub;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-subtle bg-white dark:bg-slate-900/80 shadow-sm p-4 min-h-[130px] flex flex-col"
          >
            <div className="flex items-start justify-between gap-2">
              <div className={`inline-flex p-2 rounded-xl ${iconBg} text-white shadow-sm`}>
                <Icon className="w-4 h-4" />
              </div>
              <Sparkline color={sparkColor} seed={i + (value || 1)} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted mt-3 leading-tight">
              {label}
            </p>
            <p className="text-2xl font-bold text-content-primary mt-0.5 tabular-nums">
              {format ? format(value) : value}
            </p>
            <p className="text-[11px] text-content-muted">{displaySub}</p>
            <TrendBadge trend={trends?.[key]} />
          </motion.div>
        );
      })}
    </div>
  );
}
