import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CalendarClock, AlertTriangle, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import API from '../../api/axios';
import { unwrapList } from '../../utils/apiHelpers';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import FollowUpPriorityBadge from '../followups/FollowUpPriorityBadge';
import FollowUpCategoryBadge from '../followups/FollowUpCategoryBadge';
import FollowUpCategoryTabs from '../followups/FollowUpCategoryTabs';
import AddFollowUpModal from '../followups/AddFollowUpModal';
import { enrichFollowUp } from '../followups/followupUtils';
import { createExecutiveFollowUp, updateExecutiveFollowUp, buildFollowUpPayload } from '../followups/followupApi';
import { ActionModal } from './LeadActionsMenu';

const TIME_TABS = [
  { id: 'today', label: "Today's", icon: CalendarClock },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
  { id: 'missed', label: 'Missed', icon: AlertTriangle },
];

export default function ExecutiveFollowUpsPage() {
  const [tab, setTab] = useState('today');
  const [category, setCategory] = useState('');
  const [followups, setFollowups] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [rescheduleAt, setRescheduleAt] = useState('');

  const fetchFollowups = () => {
    setLoading(true);
    const params = { tab };
    if (category) params.category = category;
    Promise.all([
      API.get('/sales-executive/followups', { params }),
      API.get('/sales-executive/leads', { params: { filter: 'all' } }),
    ])
      .then(([fu, ld]) => {
        setFollowups(unwrapList(fu.data));
        setLeads(unwrapList(ld.data));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFollowups(); }, [tab, category]);
  useDataRefresh(['followups', 'leads'], fetchFollowups);

  const handleAdd = async (data) => {
    await createExecutiveFollowUp(buildFollowUpPayload(data));
    fetchFollowups();
  };

  const handleComplete = async () => {
    await updateExecutiveFollowUp(modal._id, { action: 'complete', remarks });
    setModal(null);
    setRemarks('');
    fetchFollowups();
  };

  const handleReschedule = async () => {
    await updateExecutiveFollowUp(modal._id, {
      action: 'reschedule',
      scheduledAt: rescheduleAt ? new Date(rescheduleAt).toISOString() : undefined,
      remarks,
    });
    setModal(null);
    setRemarks('');
    setRescheduleAt('');
    fetchFollowups();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title="Follow-ups"
          description="Add and manage warm, cold, converted & expected conversion follow-ups"
          breadcrumbs={['Sales Executive', 'Follow-ups']}
        />
        <Button variant="violet" className="rounded-xl shrink-0" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Follow-up
        </Button>
      </div>

      <FollowUpCategoryTabs value={category} onChange={setCategory} layoutId="exec-fu-cat" />

      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-surface-elevated/50 border border-subtle w-fit">
        {TIME_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'text-sky-600' : 'text-content-muted hover:text-content-primary'}`}
          >
            {tab === id && <motion.div layoutId="exec-fu-tab" className="absolute inset-0 bg-surface rounded-lg shadow-sm border border-subtle" />}
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
            <motion.div key={f._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-sky-500/[0.02]">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-semibold text-content-primary">{lead.name}</p>
                  <FollowUpCategoryBadge category={f.category || 'warm'} />
                  <FollowUpPriorityBadge priority={f.priority || lead.priority} />
                </div>
                <p className="text-sm text-content-secondary">{lead.destination} · {f.type}</p>
                <p className="text-xs text-content-muted mt-1">{new Date(f.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                {f.notes && <p className="text-xs text-content-secondary mt-2 italic">{f.notes}</p>}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => { setModal({ ...f, action: 'complete' }); setRemarks(''); }}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Completed
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setModal({ ...f, action: 'reschedule' }); setRemarks(''); setRescheduleAt(''); }}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reschedule
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setModal({ ...f, action: 'remarks' }); setRemarks(f.notes || ''); }}>
                  Add Remarks
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AddFollowUpModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} leads={leads} />

      <ActionModal
        open={!!modal}
        title={modal?.action === 'complete' ? 'Mark Completed' : modal?.action === 'reschedule' ? 'Reschedule Follow-up' : 'Add Remarks'}
        onClose={() => setModal(null)}
      >
        {modal?.action === 'reschedule' && (
          <input
            type="datetime-local"
            value={rescheduleAt}
            onChange={(e) => setRescheduleAt(e.target.value)}
            className="w-full rounded-xl border border-subtle bg-surface-elevated p-3 text-sm mb-3"
          />
        )}
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          placeholder="Remarks…"
          className="w-full rounded-xl border border-subtle bg-surface-elevated p-3 text-sm mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={modal?.action === 'reschedule' ? handleReschedule : handleComplete}>
            {modal?.action === 'reschedule' ? 'Reschedule' : 'Save'}
          </Button>
        </div>
      </ActionModal>
    </div>
  );
}
