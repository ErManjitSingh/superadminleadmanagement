import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarPlus,
  ClipboardList,
  ListTodo,
  MapPin,
  Plane,
  Ticket,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

const TONE_STYLES = {
  rose: 'bg-rose-50 border-rose-100 text-rose-700',
  amber: 'bg-amber-50 border-amber-100 text-amber-700',
  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  sky: 'bg-sky-50 border-sky-100 text-sky-700',
  violet: 'bg-violet-50 border-violet-100 text-violet-700',
};

const EVENT_DOT = {
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-500',
};

const SHORTCUTS = [
  { label: 'Trip Execution', href: '/operations-manager/trip-execution', icon: MapPin, color: 'bg-violet-500' },
  { label: 'Vouchers', href: '/operations-manager/vouchers', icon: Ticket, color: 'bg-emerald-500' },
  { label: 'Vendors', href: '/operations-manager/vendors', icon: Building2, color: 'bg-orange-500' },
  { label: 'Active Trips', href: '/operations-manager/trips/active', icon: Plane, color: 'bg-sky-500' },
  { label: 'Reports', href: '/operations-manager/reports', icon: ClipboardList, color: 'bg-pink-500' },
  { label: 'Assign Tasks', href: '/operations-manager/tasks', icon: ListTodo, color: 'bg-teal-500' },
];

function Panel({ title, action, children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-2xl border border-subtle bg-white shadow-sm overflow-hidden', className)}
    >
      <div className="px-4 py-3.5 border-b border-subtle flex items-center justify-between gap-2">
        <h3 className="font-bold text-content-primary text-sm">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

export default function OperationsRightRail({ scheduleEvents = [], alerts = [] }) {
  return (
    <div className="space-y-5">
      <Panel
        title="Today's Schedule"
        action={
          <Link
            to="/operations-manager/calendar"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Add Event
          </Link>
        }
      >
        {!scheduleEvents.length ? (
          <p className="text-sm text-content-muted py-4 text-center">No events scheduled</p>
        ) : (
          <div className="relative space-y-0 pl-1">
            <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-200" />
            {scheduleEvents.map((ev) => (
              <div key={ev.id} className="relative flex gap-3 py-2.5">
                <div
                  className={cn(
                    'relative z-10 w-2.5 h-2.5 mt-1.5 ml-[13px] rounded-full ring-4 ring-white shrink-0',
                    EVENT_DOT[ev.color] || EVENT_DOT.violet
                  )}
                />
                <div className="min-w-0 flex-1 -ml-0.5">
                  <p className="text-[11px] font-semibold text-content-muted tabular-nums">{ev.time}</p>
                  <p className="text-sm font-semibold text-content-primary mt-0.5">{ev.title}</p>
                  <p className="text-xs text-content-muted mt-0.5">{ev.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Alerts & Reminders"
        action={
          <Link to="/operations-manager/operations/alerts" className="text-content-muted hover:text-violet-600">
            <Bell className="w-4 h-4" />
          </Link>
        }
      >
        {!alerts.length ? (
          <p className="text-sm text-content-muted py-4 text-center">All clear — no alerts</p>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((a) => (
              <Link
                key={a.id}
                to={a.href || '/operations-manager/operations/alerts'}
                className={cn(
                  'block rounded-xl border px-3 py-2.5 transition-colors hover:brightness-[0.98]',
                  TONE_STYLES[a.tone] || TONE_STYLES.violet
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold leading-snug">{a.title}</p>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60 mt-0.5" />
                </div>
                <p className="text-[10px] font-medium opacity-70 mt-1">{a.timeAgo}</p>
              </Link>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Quick Shortcuts">
        <div className="grid grid-cols-3 gap-2.5">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              to={s.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-subtle bg-slate-50/60 px-2 py-3 hover:bg-white hover:border-violet-200 hover:shadow-sm transition-all"
            >
              <span className={cn('w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-sm', s.color)}>
                <s.icon className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-semibold text-content-secondary text-center leading-tight group-hover:text-content-primary">
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
