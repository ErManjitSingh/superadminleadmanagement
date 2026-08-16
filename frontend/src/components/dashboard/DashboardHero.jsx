import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  Timer,
  Flame,
  AlertTriangle,
  Clock3,
  Star,
  UserRound,
} from 'lucide-react';
import KpiCard from './KpiCard';

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n?.toLocaleString('en-IN') || 0}`;
}

function buildSparkline(base, points = 8) {
  if (!base || base <= 0) return Array.from({ length: points }, (_, i) => 4 + (i % 3) * 2);
  const result = [];
  for (let i = 0; i < points; i++) {
    const variance = 0.55 + (i / points) * 0.85 + Math.sin(i * 1.2) * 0.18;
    result.push(Math.max(1, Math.round((base / points) * variance)));
  }
  return result;
}

function sparkFromStats(stats, key, fallback) {
  const series = stats?.kpiSparklines?.[key];
  if (Array.isArray(series) && series.length > 1) return series;
  return buildSparkline(fallback);
}

const KPI_CONFIG = [
  {
    key: 'totalLeads',
    label: 'Total Leads',
    icon: Users,
    color: 'bg-blue-500',
    sparkColor: '#3B82F6',
    sparkKey: 'totalLeads',
    change: '+18.5%',
    changeType: 'up',
  },
  {
    key: 'revenue',
    label: 'Total Revenue',
    icon: IndianRupee,
    color: 'bg-emerald-500',
    sparkColor: '#22C55E',
    sparkKey: 'revenue',
    format: formatCurrency,
    change: '+18.5%',
    changeType: 'up',
  },
  {
    key: 'conversionRate',
    label: 'Conversion Rate',
    icon: TrendingUp,
    color: 'bg-orange-500',
    sparkColor: '#F97316',
    sparkKey: 'conversionRate',
    suffix: '%',
    change: '-2.4%',
    changeType: 'down',
  },
  {
    key: 'convertedLeads',
    label: 'Converted Leads',
    icon: CheckCircle2,
    color: 'bg-violet-500',
    sparkColor: '#8B5CF6',
    sparkKey: 'converted',
    change: '+16.3%',
    changeType: 'up',
  },
  {
    key: 'avgResponseTime',
    label: 'Avg. Response Time',
    icon: Timer,
    color: 'bg-teal-500',
    sparkColor: '#14B8A6',
    sparkKey: 'avgResponse',
    change: '-8.5%',
    changeType: 'down',
  },
  {
    key: 'hotLeads',
    label: 'Hot Leads',
    icon: Flame,
    color: 'bg-rose-500',
    sparkColor: '#F43F5E',
    sparkKey: 'hotLeads',
    change: '+9.1%',
    changeType: 'up',
  },
];

const PRIORITY_CONFIG = [
  {
    key: 'leadsWithoutBudget',
    label: 'Leads Without Budget',
    icon: AlertTriangle,
    iconWrap: 'bg-rose-100 text-rose-600',
    href: '/leads?filter=no_budget',
  },
  {
    key: 'leadsWithoutFollowup',
    label: 'Leads Without Follow-up',
    icon: Clock3,
    iconWrap: 'bg-amber-100 text-amber-600',
    href: '/leads?filter=no_followup',
  },
  {
    key: 'highBudgetLeads',
    label: 'High Budget Leads',
    icon: Star,
    iconWrap: 'bg-violet-100 text-violet-600',
    href: '/leads?filter=high_budget',
  },
  {
    key: 'unassignedLeads',
    label: 'Unassigned Leads',
    icon: UserRound,
    iconWrap: 'bg-sky-100 text-sky-600',
    href: '/leads/unassigned',
  },
];

export default function DashboardHero({ stats }) {
  const q = stats.qualificationWidgets || {};
  const hotLeads = q.hotLeads ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3.5">
        {KPI_CONFIG.map((cfg, i) => {
          let raw;
          if (cfg.key === 'hotLeads') raw = hotLeads;
          else if (cfg.key === 'avgResponseTime') raw = stats.avgResponseTime || '—';
          else raw = stats[cfg.key];

          const value = cfg.format
            ? cfg.format(raw)
            : cfg.key === 'avgResponseTime'
              ? raw
              : `${raw ?? 0}${cfg.suffix || ''}`;

          const numericBase =
            cfg.key === 'avgResponseTime'
              ? stats.avgResponseMinutes || 0
              : typeof raw === 'number'
                ? raw
                : hotLeads;

          return (
            <KpiCard
              key={cfg.key}
              label={cfg.label}
              value={value}
              change={cfg.change}
              changeType={cfg.changeType}
              icon={cfg.icon}
              iconColor={cfg.color}
              sparkColor={cfg.sparkColor}
              sparkData={sparkFromStats(stats, cfg.sparkKey, numericBase)}
              index={i}
              compact
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {PRIORITY_CONFIG.map((item, i) => {
          const count = item.key === 'unassignedLeads'
            ? (q.unassignedLeads ?? stats.unassignedLeadsTotal ?? 0)
            : (q[item.key] || 0);
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={item.href}
                className="flex items-center gap-3 rounded-2xl border border-subtle bg-surface px-4 py-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconWrap}`}>
                  <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-content-secondary truncate">{item.label}</p>
                </div>
                <p className="text-xl font-bold text-content-primary metric-tabular">{count}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
