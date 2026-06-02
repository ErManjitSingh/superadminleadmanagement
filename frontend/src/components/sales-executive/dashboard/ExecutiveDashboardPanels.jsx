import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { formatCurrency, STATUS_STYLES, formatFollowUpDate } from '../executiveUtils';
import PriorityBadge from '../../sales-manager/PriorityBadge';
import TargetTracker from './TargetTracker';

function Panel({ title, link, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-content-primary">{title}</h3>
        {link && (
          <Link to={link} className="text-xs font-semibold text-sky-600 hover:text-sky-500 flex items-center gap-1">
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Today's Tasks" link="/sales-executive/follow-ups" delay={0.2}>
          <div className="space-y-3">
            {data.todayTasks?.length ? data.todayTasks.map((t) => (
              <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/50 border border-subtle">
                <div className="p-2 rounded-lg bg-sky-500/10"><CheckCircle2 className="w-4 h-4 text-sky-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-content-primary truncate">{t.title}</p>
                  <p className="text-xs text-content-muted">{t.destination} · {formatFollowUpDate(t.time)}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-content-muted py-4 text-center">No tasks for today</p>
            )}
          </div>
        </Panel>

        <Panel title="Recent Leads" link="/sales-executive/leads/new" delay={0.25}>
          <div className="divide-y divide-subtle">
            {data.recentLeads?.map((lead) => (
              <div key={lead._id} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/sales-executive/leads/${lead._id}/view`} className="font-semibold text-sm text-content-primary hover:text-sky-600">
                      {lead.name}
                    </Link>
                    {lead.isHot && <PriorityBadge lead={lead} />}
                  </div>
                  <p className="text-xs text-content-muted mt-0.5">{lead.destination} · {formatCurrency(lead.budget)}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ring-1 ring-inset capitalize ${STATUS_STYLES[lead.status] || STATUS_STYLES.new}`}>
                  {lead.status?.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Upcoming Follow-ups" link="/sales-executive/follow-ups" delay={0.3}>
          <div className="space-y-3">
            {data.upcomingFollowups?.map((f) => (
              <div key={f._id} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10"><Clock className="w-4 h-4 text-violet-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-content-primary">{f.customer}</p>
                  <p className="text-xs text-content-muted">{f.destination} · {formatFollowUpDate(f.scheduledAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Conversion Progress" delay={0.35}>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.conversionProgress} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" width={72} tick={{ fontSize: 11 }} stroke="currentColor" className="text-content-muted" />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                  {data.conversionProgress?.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <TargetTracker target={data.target} />
    </div>
  );
}
