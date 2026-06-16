import { motion } from 'framer-motion';
import { Users, IndianRupee, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import KpiCard from './KpiCard';

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n?.toLocaleString('en-IN') || 0}`;
}

const KPI_CONFIG = [
  { key: 'totalLeads', label: 'Total Leads', icon: Users, color: 'bg-blue-500', sparkColor: '#3B82F6' },
  { key: 'revenue', label: 'Total Revenue', icon: IndianRupee, color: 'bg-emerald-500', sparkColor: '#22C55E', format: formatCurrency },
  { key: 'conversionRate', label: 'Conversion Rate', icon: TrendingUp, color: 'bg-orange-500', sparkColor: '#F97316', suffix: '%' },
  { key: 'convertedLeads', label: 'Converted Leads', icon: CheckCircle2, color: 'bg-violet-500', sparkColor: '#8B5CF6' },
];

const QUALITY_CONFIG = [
  { key: 'leadsWithoutBudget', label: 'Leads Without Budget', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-100 dark:border-red-500/20' },
  { key: 'leadsWithoutFollowup', label: 'Leads Without Follow-up', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
  { key: 'hotLeads', label: 'Hot Leads', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' },
  { key: 'highBudgetLeads', label: 'High Budget Leads', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-100 dark:border-violet-500/20' },
];

function buildSparkline(base, points = 8) {
  if (!base || base <= 0) return Array(points).fill(0);
  const result = [];
  for (let i = 0; i < points; i++) {
    const variance = 0.6 + (i / points) * 0.8 + Math.sin(i * 1.2) * 0.15;
    result.push(Math.round((base / points) * variance));
  }
  return result;
}

export default function DashboardHero({ stats }) {
  const q = stats.qualificationWidgets || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CONFIG.map((cfg, i) => {
          const raw = stats[cfg.key];
          const value = cfg.format ? cfg.format(raw) : `${raw ?? 0}${cfg.suffix || ''}`;
          const sparkData = buildSparkline(typeof raw === 'number' ? raw : 0);
          return (
            <KpiCard
              key={cfg.key}
              label={cfg.label}
              value={value}
              change="+18.5%"
              changeType="up"
              icon={cfg.icon}
              iconColor={cfg.color}
              sparkColor={cfg.sparkColor}
              sparkData={sparkData}
              index={i}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUALITY_CONFIG.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${item.bg} ${item.border}`}
          >
            <AlertTriangle className={`w-4 h-4 shrink-0 ${item.color}`} />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-content-secondary truncate">{item.label}</p>
              <p className="text-lg font-bold text-content-primary metric-tabular">{q[item.key] || 0}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
