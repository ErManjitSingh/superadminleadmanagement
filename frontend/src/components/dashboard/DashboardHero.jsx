import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, IndianRupee, TrendingUp, Users } from 'lucide-react';

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n?.toLocaleString('en-IN')}`;
}

export default function DashboardHero({ stats }) {
  const items = [
    { label: 'Total Leads', value: stats.totalLeads, icon: Users },
    { label: 'Revenue', value: formatCurrency(stats.revenue), icon: IndianRupee },
    { label: 'Conversion', value: `${stats.conversionRate}%`, icon: TrendingUp },
    { label: 'Converted', value: stats.convertedLeads, icon: TrendingUp },
  ];
  const q = stats.qualificationWidgets || {};
  const qualityItems = [
    { label: 'Leads Without Budget', value: q.leadsWithoutBudget || 0 },
    { label: 'Leads Without Follow-up', value: q.leadsWithoutFollowup || 0 },
    { label: 'Hot Leads', value: q.hotLeads || 0 },
    { label: 'High Budget Leads', value: q.highBudgetLeads || 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-950 p-6 sm:p-8 mb-6 border border-slate-800 shadow-xl shadow-slate-900/25"
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <p className="text-blue-300/80 text-sm font-medium mb-2">Performance Overview</p>
          <p className="text-3xl sm:text-4xl font-bold text-white metric-tabular tracking-tight">
            {formatCurrency(stats.revenue)}
          </p>
          <p className="text-slate-400 text-sm mt-1">Total revenue generated this month</p>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1 mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View full report <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm px-4 py-3 hover:bg-white/10 transition-colors"
            >
              <item.icon className="w-4 h-4 text-blue-400 mb-2" />
              <p className="text-lg font-bold text-white metric-tabular">{item.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {qualityItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-2">
            <div className="flex items-center gap-1.5 text-amber-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              {item.label}
            </div>
            <p className="text-white text-lg font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
