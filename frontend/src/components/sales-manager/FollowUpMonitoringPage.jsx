import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, AlertTriangle, Clock } from 'lucide-react';
import API from '../../api/axios';
import { unwrapList } from '../../utils/apiHelpers';
import PageHeader from '../ui/PageHeader';
import FollowUpPriorityBadge from '../followups/FollowUpPriorityBadge';
import FollowUpStatusBadge from '../followups/FollowUpStatusBadge';
import FollowUpCategoryBadge from '../followups/FollowUpCategoryBadge';
import FollowUpCategoryTabs from '../followups/FollowUpCategoryTabs';
import { enrichFollowUp } from '../followups/followupUtils';

const TABS = [
  { id: 'today', label: "Today's", icon: CalendarClock },
  { id: 'missed', label: 'Missed', icon: AlertTriangle },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
];

export default function FollowUpMonitoringPage() {
  const [tab, setTab] = useState('today');
  const [category, setCategory] = useState('');
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { tab };
    if (category) params.category = category;
    API.get('/sales-manager/followups', { params })
      .then((r) => setFollowups(unwrapList(r.data)))
      .finally(() => setLoading(false));
  }, [tab, category]);

  return (
    <div className="space-y-6">
      <PageHeader title="Follow-up Monitoring" description="View team follow-ups (read-only). Only executives add follow-ups." breadcrumbs={['Sales Manager', 'Follow-ups']} />

      <FollowUpCategoryTabs value={category} onChange={setCategory} layoutId="mgr-fu-cat" />

      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-surface-elevated/50 border border-subtle w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'text-violet-600' : 'text-content-muted hover:text-content-primary'}`}
          >
            {tab === id && <motion.div layoutId="fu-tab" className="absolute inset-0 bg-surface rounded-lg shadow-sm border border-subtle" />}
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
            <motion.div key={f._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-violet-500/[0.02]">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-semibold text-content-primary">{lead.name}</p>
                  <FollowUpCategoryBadge category={f.category || 'warm'} />
                  <FollowUpPriorityBadge priority={f.priority || lead.priority} />
                  <FollowUpStatusBadge status={f.effectiveStatus || f.status} />
                </div>
                <p className="text-sm text-content-secondary">{lead.destination} · {f.assignedTo?.name}</p>
                <p className="text-xs text-content-muted mt-1">{new Date(f.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
