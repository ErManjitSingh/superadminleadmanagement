import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import API from '../../api/axios';
import { Button } from '../ui/button';
import { useLeadAssign } from '../../hooks/useLeadAssign';
import { useLeadReactivate } from '../../hooks/useLeadReactivate';
import AdminAssignLeadModal from '../leads/AdminAssignLeadModal';
import { UserPlus, RefreshCw } from 'lucide-react';
import ReactivationActionsModal from '../lead-detail/ReactivationActionsModal';
import {
  LeadDetailHeader, LeadStatusPipeline, LeadCustomerPanel, LeadActivityTimeline,
  LeadNotesSection, LeadFollowUpSection, LeadQuotationSection,
  getLeadDetailData,
} from '../lead-detail';

export default function LeaderLeadDetailPage() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [executives, setExecutives] = useState([]);
  const notesRef = useRef(null);

  const loadLead = useCallback(() => {
    setLoading(true);
    return API.get(`/team-leader/leads/${id}`, { skipSuccessToast: true })
      .then((res) => setLead(res.data))
      .catch(() => setLead(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadLead();
    API.get('/leads/assignees', { skipSuccessToast: true, skipErrorToast: true })
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

  const reactivate = useLeadReactivate({ leadId: id, onSuccess: loadLead });

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!lead) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface p-12 text-center">
        <p className="text-content-muted">Lead not found in your team</p>
        <Link to="/team-leader/leads" className="text-amber-600 text-sm mt-2 inline-block hover:underline">← Back to Team Leads</Link>
      </div>
    );
  }

  const detail = getLeadDetailData({ ...lead, followUps: lead.followups || [], quotations: lead.quotations || [] });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pb-8">
      <Link to="/team-leader/leads" className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Team Leads
      </Link>
      <div className="mb-4 flex flex-wrap gap-2">
        {reactivate.isLost(lead) ? (
          <Button variant="teal" className="gap-2" onClick={reactivate.openReactivate}>
            <RefreshCw className="w-4 h-4" /> Reactivate Lead
          </Button>
        ) : (
          <Button variant="gradient" className="gap-2" onClick={() => setAssignOpen(true)}>
            <UserPlus className="w-4 h-4" /> Assign to Executive
          </Button>
        )}
        {lead.status === 'reactivated' && (
          <Button variant="outline" onClick={reactivate.openReassign}>Reassign Reactivated Lead</Button>
        )}
        {lead?.reactivation?.isReactivated && (
          <Button variant="outline" onClick={reactivate.openStage}>Update Reactivation Stage</Button>
        )}
      </div>
      <LeadDetailHeader lead={lead} />
      <div className="mb-6"><LeadStatusPipeline status={lead.status} /></div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <aside className="xl:col-span-3 xl:sticky xl:top-20 order-2 xl:order-1">
          <LeadCustomerPanel lead={lead} valueScore={detail.valueScore} />
        </aside>
        <main className="xl:col-span-9 space-y-6 order-1 xl:order-2">
          <LeadActivityTimeline activities={detail.activities} />
          <div ref={notesRef}><LeadNotesSection notes={detail.notes} /></div>
          <LeadFollowUpSection followUps={lead.followups || detail.followUps} lead={lead} />
          <LeadQuotationSection quotations={lead.quotations || detail.quotations} />
        </main>
      </div>
      <AdminAssignLeadModal
        open={assignOpen}
        lead={lead}
        assignees={assignees}
        loading={assigneesLoading}
        onClose={() => setAssignOpen(false)}
        onAssign={(payload) => handleAssign({ ...payload, leadIds: [id] })}
        allowedRoles={['sales_executive']}
      />
      {assignConfirmDialog}
      <ReactivationActionsModal
        open={!!reactivate.mode}
        mode={reactivate.mode || 'reactivate'}
        lead={lead}
        executives={executives}
        onClose={reactivate.close}
        onSubmit={reactivate.submit}
      />
    </motion.div>
  );
}
