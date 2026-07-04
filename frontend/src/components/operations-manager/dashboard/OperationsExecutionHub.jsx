import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bus, MapPin, Plane, TowerControl } from 'lucide-react';

export default function OperationsExecutionHub({ kpis, hubStats }) {
  const pending = kpis?.pendingBookings ?? 0;
  const hotel = kpis?.hotelConfirmations ?? kpis?.hotelPending ?? 0;
  const cab = kpis?.cabConfirmations ?? kpis?.cabPending ?? 0;
  const onTrip = hubStats?.onTrip ?? kpis?.activeTrips ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50 via-blue-50/80 to-indigo-50 p-6 sm:p-8"
    >
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.4fr_auto_1fr] gap-6 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
            Trip Execution Hub
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-content-primary leading-tight">
            {pending} booking{pending === 1 ? '' : 's'} need{pending === 1 ? 's' : ''} operations setup
          </h2>
          <p className="text-sm text-content-secondary mt-2">
            {hotel} hotel · {cab} cab confirmations pending
          </p>
          <Link
            to="/operations-manager/bookings/pending"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-sm font-semibold text-blue-600 hover:bg-white hover:text-blue-700 transition-colors shadow-sm"
          >
            View Pending Bookings
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center justify-center lg:border-x border-sky-200/60 lg:px-10 py-2">
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-sm ring-4 ring-emerald-50">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-semibold text-content-secondary uppercase tracking-wide">
              On Trip
            </p>
            <p className="text-3xl font-bold text-content-primary tabular-nums mt-0.5">{onTrip}</p>
            <p className="text-xs text-content-muted mt-0.5">Bookings in progress</p>
          </div>
        </div>

        <div className="hidden lg:flex justify-end">
          <div className="relative w-44 h-32">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-24 rounded-t-2xl bg-gradient-to-t from-sky-400 to-sky-300 shadow-lg flex items-end justify-center pb-2">
              <TowerControl className="w-8 h-8 text-white/90" />
            </div>
            <div className="absolute bottom-2 left-2 w-12 h-8 rounded-lg bg-amber-400/90 shadow-md flex items-center justify-center">
              <Bus className="w-5 h-5 text-amber-900/80" />
            </div>
            <div className="absolute top-2 right-0 w-14 h-10 rounded-xl bg-white shadow-md flex items-center justify-center border border-sky-100">
              <Plane className="w-6 h-6 text-sky-500 -rotate-12" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-3 rounded-full bg-emerald-200/60" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
