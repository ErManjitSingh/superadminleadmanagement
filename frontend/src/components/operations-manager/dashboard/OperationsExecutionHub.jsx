import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bus, Plane, TowerControl } from 'lucide-react';

function HubStat({ dotClass, label, value, subtitle }) {
  return (
    <div className="text-center px-4">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
        <span className="text-xs font-semibold text-content-secondary uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-3xl font-bold text-content-primary tabular-nums">{value}</p>
      <p className="text-xs text-content-muted mt-0.5">{subtitle}</p>
    </div>
  );
}

export default function OperationsExecutionHub({ kpis, hubStats }) {
  const pending = kpis?.pendingBookings ?? 0;
  const hotel = kpis?.hotelConfirmations ?? kpis?.hotelPending ?? 0;
  const cab = kpis?.cabConfirmations ?? kpis?.cabPending ?? 0;
  const onTrip = hubStats?.onTrip ?? kpis?.activeTrips ?? 0;
  const departures = hubStats?.departuresToday ?? kpis?.todaysDepartures ?? 0;
  const arrivals = hubStats?.arrivalsToday ?? kpis?.todaysArrivals ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50 via-blue-50/80 to-indigo-50 p-6 sm:p-8"
    >
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_auto_1fr] gap-6 items-center">
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
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View Pending Bookings
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="hidden lg:flex items-center justify-center gap-6 border-x border-sky-200/60 px-6">
          <HubStat
            dotClass="bg-emerald-500"
            label="On Trip"
            value={onTrip}
            subtitle="Bookings in progress"
          />
          <HubStat
            dotClass="bg-blue-500"
            label="Departures Today"
            value={departures}
            subtitle={departures ? 'Departing today' : 'No departures'}
          />
          <HubStat
            dotClass="bg-violet-500"
            label="Arrivals Today"
            value={arrivals}
            subtitle={arrivals ? 'Arriving today' : 'No arrivals'}
          />
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

      <div className="lg:hidden grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-sky-200/60">
        <HubStat dotClass="bg-emerald-500" label="On Trip" value={onTrip} subtitle="In progress" />
        <HubStat dotClass="bg-blue-500" label="Departures" value={departures} subtitle="Today" />
        <HubStat dotClass="bg-violet-500" label="Arrivals" value={arrivals} subtitle="Today" />
      </div>
    </motion.div>
  );
}
