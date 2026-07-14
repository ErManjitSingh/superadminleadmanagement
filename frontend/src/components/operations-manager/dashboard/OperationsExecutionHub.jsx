import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Car, MapPin, Plane } from 'lucide-react';

function ProgressRing({ value = 0 }) {
  const size = 148;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative w-[148px] h-[148px] shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-3xl font-bold text-white tabular-nums leading-none">{value}%</p>
        <p className="text-[11px] font-medium text-white/80 mt-1 leading-tight px-3">
          Operations
          <br />
          Progress
        </p>
      </div>
    </div>
  );
}

function HubIllustration() {
  return (
    <div className="relative w-full max-w-[280px] h-36 mx-auto lg:mx-0">
      <div className="absolute inset-x-4 bottom-0 h-16 rounded-[40%] bg-emerald-400/30 blur-[1px]" />
      <div className="absolute left-6 bottom-4 right-10 h-10 rounded-full bg-gradient-to-t from-emerald-600/80 to-emerald-400/70" />
      <div className="absolute left-10 bottom-10 w-20 h-14 rounded-t-2xl bg-slate-700/90 shadow-lg" />
      <div className="absolute left-[4.5rem] bottom-[3.75rem] w-12 h-10 rounded-t-xl bg-slate-600/90" />
      <div className="absolute right-8 bottom-6 w-[7.5rem] h-12 rounded-2xl bg-slate-900 shadow-xl border border-white/10 flex items-center justify-center">
        <Car className="w-8 h-8 text-amber-300" />
      </div>
      <div className="absolute right-4 top-2 w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/25 shadow-lg">
        <Plane className="w-7 h-7 text-white -rotate-12" />
      </div>
      <div className="absolute left-4 top-8 px-2.5 py-1 rounded-lg bg-white/15 border border-white/20 text-[10px] font-semibold text-white flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        On Trip Now
      </div>
    </div>
  );
}

export default function OperationsExecutionHub({ kpis, hubStats }) {
  const pending = kpis?.pendingBookings ?? 0;
  const hotel = kpis?.hotelConfirmations ?? kpis?.hotelPending ?? 0;
  const cab = kpis?.cabConfirmations ?? kpis?.cabPending ?? 0;
  const progress = hubStats?.operationsProgress ?? kpis?.operationsProgress ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 p-6 sm:p-7 text-white shadow-lg shadow-violet-500/25"
    >
      <div className="absolute -right-10 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-20 w-56 h-56 rounded-full bg-indigo-300/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.35fr_auto_1fr] gap-6 items-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/75 mb-2">
            Trip Execution Hub
          </p>
          <h2 className="text-xl sm:text-2xl font-bold leading-tight">
            {pending} booking{pending === 1 ? '' : 's'} need{pending === 1 ? 's' : ''} operations setup
          </h2>
          <p className="text-sm text-white/80 mt-2">
            {hotel} hotel · {cab} cab confirmations pending
          </p>
          <Link
            to="/operations-manager/bookings/pending"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-white text-sm font-semibold text-violet-700 hover:bg-violet-50 transition-colors shadow-md"
          >
            View Pending Bookings
            <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center">
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        <div className="flex justify-center lg:px-4">
          <ProgressRing value={progress} />
        </div>

        <div className="hidden md:block">
          <HubIllustration />
        </div>
      </div>
    </motion.div>
  );
}
