import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserPlus,
  CalendarClock,
  FileText,
  UserCircle,
  Calendar,
  BarChart3,
  Sparkles,
  Clock,
} from 'lucide-react';

const ExecutivePipelineChart = lazy(() => import('../dashboard/ExecutivePipelineChart'));

const QUICK_ACTIONS = [
  { to: '/sales-executive/leads/new', label: 'New Lead', icon: UserPlus, color: 'text-violet-600 bg-violet-500/10' },
  { to: '/sales-executive/follow-ups', label: 'Follow-up', icon: CalendarClock, color: 'text-amber-600 bg-amber-500/10' },
  { to: '/sales-executive/quotations/new', label: 'Quotation', icon: FileText, color: 'text-indigo-600 bg-indigo-500/10' },
  { to: '/sales-executive/customers', label: 'Customers', icon: UserCircle, color: 'text-sky-600 bg-sky-500/10' },
  { to: '/sales-executive/calendar', label: 'Calendar', icon: Calendar, color: 'text-emerald-600 bg-emerald-500/10' },
  { to: '/sales-executive/dashboard', label: 'Reports', icon: BarChart3, color: 'text-rose-600 bg-rose-500/10' },
];

const PRIORITY_STYLES = {
  urgent: 'bg-rose-500 text-white',
  high: 'bg-orange-500 text-white',
  hot: 'bg-violet-600 text-white',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

function formatTaskTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function RailCard({ title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-subtle bg-white dark:bg-slate-900/80 shadow-sm p-4"
    >
      <h3 className="font-bold text-content-primary text-sm mb-3">{title}</h3>
      {children}
    </motion.div>
  );
}

function CompactPipeline({ data = [], conversionRate = 0 }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  const chartData = data.filter((d) => d.value > 0);

  if (!data.length) {
    return <p className="text-sm text-content-muted py-8 text-center">No pipeline data yet</p>;
  }

  return (
    <div className="space-y-3">
      <Suspense fallback={<div className="h-40 rounded-xl bg-surface-elevated/60 animate-pulse" />}>
        {chartData.length ? (
          <ExecutivePipelineChart
            data={chartData}
            total={Math.round(conversionRate)}
            centerLabel="Conversion Rate"
            centerSuffix="%"
            compact
          />
        ) : (
          <p className="text-sm text-content-muted py-8 text-center">No pipeline data yet</p>
        )}
      </Suspense>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-xs text-content-secondary truncate flex-1">{item.name}</span>
            <span className="text-xs font-semibold text-content-primary tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-content-muted text-center pt-1 border-t border-subtle">
        Total Leads: <span className="font-semibold text-content-primary">{total}</span>
      </p>
    </div>
  );
}

export default function MyLeadsRightRail({ data }) {
  const conversionRate = data?.target?.conversionRate ?? 0;
  const pipeline = data?.pipelineOverview || [];
  const tasks = data?.todayTasks || [];

  return (
    <aside className="space-y-4 lg:sticky lg:top-4">
      <RailCard title="Your Pipeline" delay={0.05}>
        <CompactPipeline data={pipeline} conversionRate={conversionRate} />
      </RailCard>

      <RailCard title="Today's Tasks" delay={0.1}>
        {tasks.length ? (
          <div className="space-y-2.5">
            {tasks.map((t) => {
              const pKey = String(t.priority || 'medium').toLowerCase();
              const badge = PRIORITY_STYLES[pKey] || PRIORITY_STYLES.medium;
              return (
                <div
                  key={t._id}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-subtle"
                >
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 shrink-0 mt-0.5 w-[68px]">
                    <Clock className="w-3 h-3" />
                    {formatTaskTime(t.time)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-content-primary truncate">{t.title}</p>
                    {t.destination && (
                      <p className="text-[10px] text-content-muted truncate mt-0.5">{t.destination}</p>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 capitalize ${badge}`}>
                    {pKey}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-content-muted py-6 text-center">No tasks for today</p>
        )}
        <Link
          to="/sales-executive/follow-ups"
          className="block text-center text-xs font-semibold text-violet-600 hover:text-violet-500 mt-3"
        >
          View all follow-ups
        </Link>
      </RailCard>

      <RailCard title="Quick Actions" delay={0.15}>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon, color }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-subtle hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors"
            >
              <span className={`inline-flex p-2 rounded-lg ${color}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-semibold text-content-secondary text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </RailCard>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 p-4 text-white shadow-md shadow-violet-500/20"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-white/15 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200 mb-1">Pro Tip</p>
            <p className="text-xs font-medium leading-relaxed text-white/95">
              Respond to leads within 5 mins to increase conversions by 50%.
            </p>
          </div>
        </div>
        <svg
          viewBox="0 0 80 32"
          className="absolute bottom-2 right-2 w-16 h-6 opacity-40"
          aria-hidden
        >
          <polyline
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            points="0,24 12,20 24,22 36,14 48,16 60,8 72,10 80,4"
          />
        </svg>
      </motion.div>
    </aside>
  );
}
