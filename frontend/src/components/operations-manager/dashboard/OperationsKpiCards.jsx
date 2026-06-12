import { motion } from 'framer-motion';
import {
  Clock, Hotel, Car, Plane, CircleCheck, Calendar, Ticket, Compass,
} from 'lucide-react';

const cards = [
  { key: 'todaysArrivals', label: "Today's Arrivals", icon: Calendar, gradient: 'from-sky-500 to-blue-600' },
  { key: 'todaysDepartures', label: "Today's Departures", icon: Plane, gradient: 'from-indigo-500 to-violet-600' },
  { key: 'upcomingTours', label: 'Upcoming Tours', icon: Compass, gradient: 'from-cyan-500 to-teal-600' },
  { key: 'pendingBookings', label: 'Pending Bookings', icon: Clock, gradient: 'from-amber-500 to-orange-600' },
  { key: 'hotelPending', label: 'Hotel Pending', icon: Hotel, gradient: 'from-teal-500 to-cyan-600' },
  { key: 'cabPending', label: 'Cab Pending', icon: Car, gradient: 'from-violet-500 to-purple-600' },
  { key: 'activityPending', label: 'Activity Pending', icon: Compass, gradient: 'from-pink-500 to-rose-600' },
  { key: 'voucherPending', label: 'Voucher Pending', icon: Ticket, gradient: 'from-fuchsia-500 to-purple-600' },
  { key: 'activeTrips', label: 'Active Trips', icon: Plane, gradient: 'from-emerald-500 to-green-600' },
  { key: 'completedTrips', label: 'Completed', icon: CircleCheck, gradient: 'from-slate-500 to-zinc-600' },
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
          transition={{ delay: i * 0.03 }}
          className="relative overflow-hidden rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-4 min-h-[110px]"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.07]`} />
          <div className="relative">
            <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-content-muted leading-tight">{label}</p>
            <p className="text-2xl font-bold text-content-primary mt-1 tabular-nums">{kpis[key] ?? 0}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
