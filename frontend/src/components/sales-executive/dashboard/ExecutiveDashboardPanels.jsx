import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
import { formatCurrency, formatFollowUpDate } from '../executiveUtils';

const ExecutivePipelineChart = lazy(() => import('./ExecutivePipelineChart'));
const ExecutiveLeadSourceChart = lazy(() => import('./ExecutiveLeadSourceChart'));

function ChartSkeleton() {
  return <div className="h-52 rounded-xl bg-surface-elevated/60 animate-pulse" />;
}

function getInitials(name) {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??'
  );
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

function LeadStatusBadge({ lead }) {
  if (lead.isHot) {
    return (
      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-orange-500 text-white shrink-0">
        Hot
      </span>
    );
  }
  const status = lead.status?.replace(/_/g, ' ') || 'new';
  if (status === 'new') {
    return (
      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 shrink-0 capitalize">
        New
      </span>
    );
  }
  if (status === 'contacted') {
    return (
      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-violet-400 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 shrink-0 capitalize">
        Contacted
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-subtle text-content-secondary bg-surface-elevated shrink-0 capitalize">
      {status}
    </span>
  );
}

function Panel({ title, link, children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border border-subtle bg-white dark:bg-slate-900/80 shadow-sm p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-content-primary">{title}</h3>
        {link && (
          <Link to={link} className="text-xs font-semibold text-violet-600 hover:text-violet-500 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export default function ExecutiveDashboardPanels({ data }) {
  if (!data) return null;

  const totalPipeline = (data.pipelineOverview || []).reduce((s, item) => s + item.value, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Today's Tasks" link="/sales-executive/follow-ups" delay={0.2}>
          {data.todayTasks?.length ? (
            <div className="space-y-3">
              {data.todayTasks.map((t) => (
                <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <ClipboardCheck className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-content-primary truncate">{t.title}</p>
                    <p className="text-xs text-content-muted">{t.destination} · {formatFollowUpDate(t.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center mb-4">
                <ClipboardCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-content-primary">No tasks for today</p>
              <p className="text-sm text-content-muted mt-1">Enjoy your free time! 🎉</p>
            </div>
          )}
        </Panel>

        <Panel title="Recent Leads" link="/sales-executive/leads/all" delay={0.25}>
          <div className="space-y-1">
            {data.recentLeads?.length ? data.recentLeads.map((lead, i) => (
              <div key={lead._id} className="flex items-center gap-3 py-3 border-b border-subtle last:border-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                  {getInitials(lead.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/sales-executive/leads/${lead._id}/view`}
                    className="font-semibold text-sm text-content-primary hover:text-violet-600 truncate block"
                  >
                    {lead.name}
                  </Link>
                  <p className="text-xs text-content-muted mt-0.5 truncate">
                    {lead.destination} · {formatCurrency(lead.budget)}
                  </p>
                </div>
                <LeadStatusBadge lead={lead} />
              </div>
            )) : (
              <p className="text-sm text-content-muted py-8 text-center">No leads yet</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Pipeline Overview" delay={0.3}>
          <Suspense fallback={<ChartSkeleton />}>
            <ExecutivePipelineChart data={data.pipelineOverview} total={totalPipeline} />
          </Suspense>
        </Panel>

        <Panel title="Lead Source" delay={0.35}>
          <Suspense fallback={<ChartSkeleton />}>
            <ExecutiveLeadSourceChart data={data.leadSources} />
          </Suspense>
        </Panel>
      </div>
    </div>
  );
}
