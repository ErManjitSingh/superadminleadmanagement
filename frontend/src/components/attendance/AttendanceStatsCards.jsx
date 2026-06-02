import { motion } from 'framer-motion';
import { UserCheck, UserX, Clock, Building2, Home, Wifi } from 'lucide-react';

const cards = [
  { key: 'presentToday', label: 'Present Today', icon: UserCheck, gradient: 'from-emerald-500 to-teal-600' },
  { key: 'absentToday', label: 'Absent Today', icon: UserX, gradient: 'from-rose-500 to-pink-600' },
  { key: 'lateToday', label: 'Late Today', icon: Clock, gradient: 'from-amber-500 to-orange-600' },
  { key: 'officeCount', label: 'Office Users', icon: Building2, gradient: 'from-blue-500 to-indigo-600' },
  { key: 'wfhCount', label: 'WFH Users', icon: Home, gradient: 'from-violet-500 to-purple-600' },
  { key: 'onlineCount', label: 'Currently Online', icon: Wifi, gradient: 'from-cyan-500 to-sky-600' },
];

export default function AttendanceStatsCards({ summary }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map(({ key, label, icon: Icon, gradient }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="relative overflow-hidden rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-4 min-h-[100px]"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.07]`} />
          <div className="relative">
            <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">{label}</p>
            <p className="text-2xl font-bold text-content-primary tabular-nums mt-0.5">{summary[key] ?? 0}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
