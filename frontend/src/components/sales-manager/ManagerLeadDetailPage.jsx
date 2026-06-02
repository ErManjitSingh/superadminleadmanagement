import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus } from 'lucide-react';
import API from '../../api/axios';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { Button } from '../ui/button';
import AdminAssignLeadModal from '../leads/AdminAssignLeadModal';
import { useLeadAssign } from '../../hooks/useLeadAssign';
import ReactivationActionsModal from '../lead-detail/ReactivationActionsModal';
import {
  LeadDetailHeader,
  LeadStatusPipeline,
  LeadCustomerPanel,
  LeadActivityTimeline,
  LeadNotesSection,
  LeadFollowUpSection,
  LeadQuotationSection,
  getLeadDetailData,
} from '../lead-detail';

export default function ManagerLeadDetailPage() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [reactivationMode, setReactivationMode] = useState('');
  const notesRef = useRef(null);

  const loadLead = useCallback(() => {
    setLoading(true);
    return API.get(`/sales-manager/leads/${id}`)
      .then((res) => setLead(res.data))
      .catch(() => setLead(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadLead();
    API.get('/leads/assignees')
      .then((r) => setExecutives(r.data?.salesExecutives || []))
      .catch(() => setExecutives([]));
  }, [loadLead]);

  useDataRefresh(['leads'], loadLead);

  const { assignees, assigneesLoading, handleAssign, assignConfirmDialog } = useLeadAssign({
    onAssigned: async () => {
      setAssignOpen(false);
      await loadLead();
    },
  });

  const onConfirmAssign = async (payload) => {
    await handleAssign({ ...payload, leadIds: payload.leadIds || [id] });
  };

  const handleReactivationAction = async (payload) => {
    const endpoint =
      reactivationMode === 'reactivate'
        ? `/leads/${id}/reactivate`
        : reactivationMode === 'reassign'
          ? `/leads/${id}/reassign-reactivated`
          : `/leads/${id}/reactivation-stage`;
    const method = reactivationMode === 'stage' ? 'patch' : 'post';
    await API[method](endpoint, payload);
    setReactivationMode('');
    await loadLead();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-9 h-9 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface p-12 text-center">
        <p className="text-content-muted">Lead not found</p>
        <Link to="/sales-manager/leads/all" className="text-violet-600 text-sm mt-2 inline-block hover:underline">
          ← Back to leads
        </Link>
      </div>
    );
  }

  const detail = getLeadDetailData(lead);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link
          to="/sales-manager/leads/all"
          className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to leads
        </Link>
        <Button variant="gradient" onClick={() => setAssignOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" />
          {lead.assignedTo ? 'Reassign Lead' : 'Assign Lead'}
        </Button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {['lost', 'booked_from_another_company'].includes(lead.status) && (
          <Button variant="teal" onClick={() => setReactivationMode('reactivate')}>Reactivate Lead</Button>
        )}
        {lead.status === 'reactivated' && (
          <Button variant="outline" onClick={() => setReactivationMode('reassign')}>Reassign Reactivated Lead</Button>
        )}
        {lead?.reactivation?.isReactivated && (
          <Button variant="outline" onClick={() => setReactivationMode('stage')}>Update Reactivation Stage</Button>
        )}
      </div>

      <LeadDetailHeader lead={lead} />
      <div className="mb-6">
        <LeadStatusPipeline status={lead.status} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <aside className="xl:col-span-3 xl:sticky xl:top-20 order-2 xl:order-1">
          <LeadCustomerPanel lead={lead} valueScore={detail.valueScore} />
        </aside>
        <main className="xl:col-span-9 space-y-6 order-1 xl:order-2">
          <LeadActivityTimeline activities={detail.activities} />
          <div ref={notesRef}>
            <LeadNotesSection notes={detail.notes} />
          </div>
          <LeadFollowUpSection followUps={lead.followups || detail.followUps} lead={lead} canCreate={false} />
          <LeadQuotationSection quotations={detail.quotations} />
        </main>
      </div>

      <AdminAssignLeadModal
        open={assignOpen}
        lead={lead}
        assignees={assignees}
        loading={assigneesLoading}
        onClose={() => setAssignOpen(false)}
        onAssign={onConfirmAssign}
        allowedRoles={['sales_manager', 'team_leader', 'sales_executive']}
      />
      {assignConfirmDialog}
      <ReactivationActionsModal
        open={!!reactivationMode}
        mode={reactivationMode || 'reactivate'}
        executives={executives}
        onClose={() => setReactivationMode('')}
        onSubmit={handleReactivationAction}
      />
    </motion.div>
  );
}
