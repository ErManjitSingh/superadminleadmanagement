import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import API from '../../api/axios';
import { useFollowUpsQuery } from '../../features/followups/hooks/useFollowUpsQuery';
import PageHeader from '../ui/PageHeader';
import Avatar from '../ui/Avatar';
import FollowUpPriorityBadge from '../followups/FollowUpPriorityBadge';
import FollowUpStatusBadge from '../followups/FollowUpStatusBadge';
import FollowUpCategoryBadge from '../followups/FollowUpCategoryBadge';
import FollowUpCategoryTabs from '../followups/FollowUpCategoryTabs';
import { enrichFollowUp } from '../followups/followupUtils';

const TABS = [
  { id: 'today', label: "Today's Follow-ups", icon: CalendarClock },
  { id: 'missed', label: 'Missed Follow-ups', icon: AlertTriangle },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
];

export default function LeaderFollowUpsPage() {
  const [tab, setTab] = useState('today');
  const [category, setCategory] = useState('');
  const [executives, setExecutives] = useState([]);
  const { data, isLoading: loading } = useFollowUpsQuery({
    endpoint: '/team-leader/followups',
    kpiTab: tab,
    filters: { category },
    limit: 100,
  });
  const followups = data?.data ?? [];

  useEffect(() => {
    API.get('/team-leader/executives').then((ex) => setExecutives(ex.data));
  }, []);

  const execStats = executives.map((ex) => {
    const mine = followups.filter((f) => f.assignedTo?.name === ex.name);
    const missed = mine.filter((f) => f.status === 'missed' || (f.status === 'pending' && new Date(f.scheduledAt) < new Date('2026-05-31T00:00:00.000Z')));
    return { ...ex, total: mine.length, missed: missed.length, done: ex.followUpsDone };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Team Follow-ups" description="View squad follow-ups (read-only). Executives add all follow-ups." breadcrumbs={['Team Leader', 'Team Follow-ups']} />

      <FollowUpCategoryTabs value={category} onChange={setCategory} layoutId="tl-fu-cat" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {execStats.map((ex) => (
          <div key={ex._id} className="rounded-xl border border-subtle bg-surface/80 p-4 flex items-center gap-3">
            <Avatar name={ex.name} size="sm" className="ring-2 ring-amber-500/20" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{ex.name}</p>
              <p className="text-xs text-content-muted">{ex.total} in view · {ex.missed} missed</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> {ex.followUpsDone}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-surface-elevated/50 border border-subtle w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === id ? 'text-amber-600' : 'text-content-muted hover:text-content-primary'}`}>
            {tab === id && <motion.div layoutId="tl-fu-tab" className="absolute inset-0 bg-surface rounded-lg shadow-sm border border-subtle" />}
            <span className="relative flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl divide-y divide-subtle">
        {loading ? (
          <div className="p-12 text-center text-content-muted">Loading…</div>
        ) : followups.length === 0 ? (
          <div className="p-12 text-center text-content-muted">No follow-ups in this category</div>
        ) : followups.map((raw, i) => {
          const f = enrichFollowUp(raw);
          const lead = f.lead || {};
          return (
            <motion.div key={f._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-amber-500/[0.02]">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-semibold text-content-primary">{lead.name}</p>
                  <FollowUpCategoryBadge category={f.category || 'warm'} />
                  <FollowUpPriorityBadge priority={f.priority || lead.priority} />
                  <FollowUpStatusBadge status={f.effectiveStatus || f.status} />
                </div>
                <p className="text-sm text-content-secondary">{lead.destination} · Executive: <span className="font-medium">{f.assignedTo?.name}</span></p>
                <p className="text-xs text-content-muted mt-1">{new Date(f.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
