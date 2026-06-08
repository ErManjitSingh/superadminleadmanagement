import { motion } from 'framer-motion';
import { Clock, Hotel, Car, Plane, CircleCheck } from 'lucide-react';

const cards = [
  { key: 'pendingBookings', label: 'Pending Bookings', icon: Clock, gradient: 'from-amber-500 to-orange-600' },
  { key: 'hotelConfirmations', label: 'Hotel Confirmations', icon: Hotel, gradient: 'from-teal-500 to-cyan-600' },
  { key: 'cabConfirmations', label: 'Cab Confirmations', icon: Car, gradient: 'from-violet-500 to-purple-600' },
  { key: 'activeTrips', label: 'Active Trips', icon: Plane, gradient: 'from-emerald-500 to-green-600' },
  { key: 'completedTrips', label: 'Completed Trips', icon: CircleCheck, gradient: 'from-slate-500 to-zinc-600' },
];

export default function OperationsKpiCards({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map(({ key, label, icon: Icon, gradient }, i) => (
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
            <p className="text-2xl font-bold text-content-primary mt-1 tabular-nums">{kpis[key]}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
