import { motion } from 'framer-motion';
import { Users, CalendarClock, Flame, FileText, Trophy, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../executiveUtils';

const cards = [
  { key: 'myLeads', label: 'My Leads', icon: Users, gradient: 'from-sky-500 to-cyan-600' },
  { key: 'todayFollowups', label: "Today's Follow-ups", icon: CalendarClock, gradient: 'from-violet-500 to-purple-600' },
  { key: 'hotLeads', label: 'Hot Leads', icon: Flame, gradient: 'from-rose-500 to-orange-600' },
  { key: 'quotationsSent', label: 'Quotations Sent', icon: FileText, gradient: 'from-indigo-500 to-blue-600' },
  { key: 'convertedLeads', label: 'Converted Leads', icon: Trophy, gradient: 'from-emerald-500 to-teal-600' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: IndianRupee, gradient: 'from-brand-500 to-sky-600', format: formatCurrency },
];

export default function ExecutiveKpiCards({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map(({ key, label, icon: Icon, gradient, format }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-4 min-h-[118px]"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.07]`} />
          <div className="relative">
            <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-content-muted leading-tight">{label}</p>
            <p className="text-xl font-bold text-content-primary mt-1 tabular-nums">
              {format ? format(kpis[key]) : kpis[key]}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
