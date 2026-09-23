import { Users, IndianRupee, CheckCircle2, TrendingUp, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useDashboardQuery } from '../../features/dashboard/hooks/useDashboardQuery';
import { cn } from '../../lib/utils';

function formatCurrency(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 0)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function buildSparkline(base, points = 7) {
  if (!base || base <= 0) return Array(points).fill(0);
  return Array.from({ length: points }, (_, i) =>
    Math.round((base / points) * (0.55 + (i / points) * 0.95 + Math.sin(i * 1.1) * 0.14))
  );
}

const CARDS = [
  {
    key: 'totalLeads',
    label: 'Total Leads',
    getValue: (s) => s.totalLeads ?? 0,
    change: '+18.5%',
    icon: Users,
    spark: (s) => s.totalLeads,
    tint: 'from-sky-500/[0.07] via-white to-white dark:from-sky-500/10 dark:via-slate-900 dark:to-slate-900',
    bar: 'from-sky-400 to-blue-500',
    iconWrap: 'bg-sky-500 text-white shadow-sky-500/25',
    accent: 'text-sky-600 dark:text-sky-400',
    sparkColor: '#0EA5E9',
  },
  {
    key: 'totalValue',
    label: 'Total Value',
    getValue: (s) => formatCurrency(s.totalBudget ?? s.revenue),
    change: '+24.6%',
    icon: IndianRupee,
    spark: (s) => s.totalBudget ?? s.revenue,
    tint: 'from-emerald-500/[0.07] via-white to-white dark:from-emerald-500/10 dark:via-slate-900 dark:to-slate-900',
    bar: 'from-emerald-400 to-teal-500',
    iconWrap: 'bg-emerald-500 text-white shadow-emerald-500/25',
    accent: 'text-emerald-600 dark:text-emerald-400',
    sparkColor: '#10B981',
  },
  {
    key: 'converted',
    label: 'Converted',
    getValue: (s) => s.convertedLeads ?? 0,
    change: '+15.2%',
    icon: CheckCircle2,
    spark: (s) => s.convertedLeads,
    tint: 'from-amber-500/[0.07] via-white to-white dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900',
    bar: 'from-amber-400 to-orange-500',
    iconWrap: 'bg-amber-500 text-white shadow-amber-500/25',
    accent: 'text-amber-600 dark:text-amber-400',
    sparkColor: '#F59E0B',
  },
  {
    key: 'rate',
    label: 'Conv. Rate',
    getValue: (s) => `${s.conversionRate ?? 0}%`,
    change: '+3.8%',
    icon: TrendingUp,
    spark: (s) => s.conversionRate,
    tint: 'from-violet-500/[0.07] via-white to-white dark:from-violet-500/10 dark:via-slate-900 dark:to-slate-900',
    bar: 'from-violet-400 to-fuchsia-500',
    iconWrap: 'bg-violet-500 text-white shadow-violet-500/25',
    accent: 'text-violet-600 dark:text-violet-400',
    sparkColor: '#8B5CF6',
  },
];

function MiniSpark({ data, color, id }) {
  const chartData = data.map((v, i) => ({ i, v }));
  if (!chartData.some((d) => d.v > 0)) return null;
  return (
    <div className="h-7 w-full opacity-80 group-hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.6}
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function LeadKpiStrip() {
  const { data: stats, isLoading } = useDashboardQuery();

  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[92px] rounded-xl bg-white border border-subtle animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 mb-5">
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        const value = card.getValue(stats);
        const sparkData = buildSparkline(typeof card.spark(stats) === 'number' ? card.spark(stats) : 0);

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            className={cn(
              'group relative overflow-hidden rounded-xl border border-subtle/80',
              'bg-gradient-to-br shadow-sm hover:shadow-md',
              'transition-shadow duration-300',
              card.tint,
            )}
          >
            <div className={cn('absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r', card.bar)} />
            <div
              className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-[0.12] blur-2xl"
              style={{ background: card.sparkColor }}
            />

            <div className="relative p-2.5 sm:p-3 flex flex-col gap-1.5 min-h-[92px]">
              <div className="flex items-center justify-between gap-2">
                <div
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-lg shadow-md',
                    card.iconWrap,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5',
                    'text-[10px] font-bold tabular-nums text-emerald-700',
                    'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/15',
                  )}
                >
                  <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2.5} />
                  {card.change}
                </span>
              </div>

              <div className="flex items-end justify-between gap-2 mt-auto">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-content-muted truncate">
                    {card.label}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xl sm:text-[22px] font-bold tabular-nums tracking-tight leading-none',
                      card.accent,
                    )}
                  >
                    {value}
                  </p>
                </div>
                <div className="w-[64px] sm:w-[72px] shrink-0">
                  <MiniSpark data={sparkData} color={card.sparkColor} id={`lead-kpi-${card.key}`} />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
