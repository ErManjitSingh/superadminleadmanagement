import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { canManageFollowUps } from '../lib/followupPermissions';
import { usePermissions } from '../hooks/usePermissions';
import AdminAssignLeadModal from '../components/leads/AdminAssignLeadModal';
import { assignAllowedRoles, canAssignLeads } from '../lib/canAssignLeads';
import { Button } from '../components/ui/button';
import { useLeadAssign } from '../hooks/useLeadAssign';
import { useDataRefresh } from '../hooks/useDataRefresh';
import {
  LeadDetailHeader,
  LeadStatusPipeline,
  LeadCustomerPanel,
  LeadActivityTimeline,
  LeadFollowUpSection,
  LeadQuotationSection,
  LeadActionPanel,
  LeadTransferHistory,
  LeadAuditPanel,
  ReactivationActionsModal,
} from '../components/lead-detail';
import { useLeadQuery } from '../features/leads/hooks/useLeadDetailQuery';
import { useLeadActivities } from '../features/leads/hooks/useLeadActivities';
import { invalidateLeadDetail } from '../lib/queryInvalidation';
import CallNoteModal from '../components/leads/CallNoteModal';
import MergeLeadModal from '../components/leads/MergeLeadModal';
import { checkLeadDuplicate } from '../services/leadEnterpriseApi';
import LeadContactActions from '../components/whatsapp-contact/LeadContactActions';
import LeadEmailHistory from '../components/email/LeadEmailHistory';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { can } = usePermissions();
  const isAdmin = user?.role === 'admin';
  const userCanAssignLeads = canAssignLeads(user?.role);
  const canCreateFollowUp = canManageFollowUps(user);
  const canEditLead = can('leads', 'edit');

  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [reactivationMode, setReactivationMode] = useState('');
  const [reactivationExecs, setReactivationExecs] = useState([]);
  const [callNoteOpen, setCallNoteOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const leadQuery = useLeadQuery(id);

  const refreshLead = () => invalidateLeadDetail(queryClient, id);

  useEffect(() => {
    if (!['admin', 'sales_manager', 'team_leader'].includes(user?.role)) return;
    API.get('/leads/assignees', { skipSuccessToast: true, skipErrorToast: true })
      .then((res) => setReactivationExecs(res.data?.salesExecutives || []))
      .catch(() => setReactivationExecs([]));
  }, [user?.role]);

  useDataRefresh([`lead:${id}`, 'leads'], refreshLead);

  useEffect(() => {
    const currentLead = leadQuery.data;
    if (!currentLead || !['admin', 'sales_manager'].includes(user?.role)) {
      setHasDuplicates(false);
      return;
    }
    checkLeadDuplicate({
      phone: currentLead.phone,
      alternatePhone: currentLead.alternatePhone,
      excludeId: currentLead._id,
    })
      .then((res) => setHasDuplicates((res.matches || []).length > 0))
      .catch(() => setHasDuplicates(false));
  }, [leadQuery.data, user?.role]);

  const { assignees, assigneesLoading, assignModal, openAssign, closeAssign, handleAssign } = useLeadAssign({
    onAssigned: refreshLead,
  });

  const lead = leadQuery.data;
  const loading = leadQuery.isLoading && !lead;
  const { activities, timelineLoading, detail } = useLeadActivities(lead, id);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 rounded-2xl bg-surface-elevated" />
        <div className="h-20 rounded-2xl bg-surface-elevated" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3 h-[600px] rounded-2xl bg-surface-elevated" />
          <div className="xl:col-span-6 h-[600px] rounded-2xl bg-surface-elevated" />
          <div className="xl:col-span-3 h-[400px] rounded-2xl bg-surface-elevated" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface p-12 text-center">
        <p className="text-content-muted">Lead not found</p>
        <Link to="/leads" className="text-brand-600 text-sm mt-2 inline-block hover:underline">
          ← Back to leads
        </Link>
      </div>
    );
  }

  const handleReactivationAction = async (payload) => {
    if (!reactivationMode) return;
    const endpoint =
      reactivationMode === 'reactivate'
        ? `/leads/${id}/reactivate`
        : reactivationMode === 'reassign'
          ? `/leads/${id}/reassign-reactivated`
          : `/leads/${id}/reactivation-stage`;
    const method = reactivationMode === 'stage' ? 'patch' : 'post';
    await API[method](endpoint, payload);
    setReactivationMode('');
    await refreshLead();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pb-8">
      <LeadDetailHeader lead={lead} />

      <div className="mb-6">
        <LeadStatusPipeline status={lead.status} />
      </div>

      <LeadContactActions
        lead={lead}
        leadId={id}
        contactEndpoint="/leads"
        onCreateQuote={
          can('quotations', 'create')
            ? () => navigate(`/quotations/new?leadId=${id}`)
            : undefined
        }
        onContactLogged={refreshLead}
        onEmailSent={refreshLead}
        className="mb-6"
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <aside className="xl:col-span-3 xl:sticky xl:top-20 space-y-4 order-2 xl:order-1">
          <LeadCustomerPanel lead={lead} />
          <LeadEmailHistory leadId={id} emailEndpoint="/leads" refreshKey={lead?.lastContactedAt || lead?.updatedAt} />
        </aside>

        <main className="xl:col-span-6 space-y-6 order-1 xl:order-2">
          <LeadActivityTimeline
            activities={activities}
            loading={timelineLoading}
            quotations={lead.quotations || []}
          />
          <LeadFollowUpSection
            followUps={lead.followups || detail.followUps}
            lead={lead}
            canCreate={canCreateFollowUp}
            onRefresh={refreshLead}
            onFollowUpAdded={() => refreshLead()}
            modalOpen={followUpModalOpen}
            onModalOpenChange={setFollowUpModalOpen}
          />
          <LeadQuotationSection
            quotations={detail.quotations}
            lead={lead}
            leadId={id}
            emailEndpoint="/leads"
            onEmailSent={refreshLead}
          />
          <LeadTransferHistory leadId={id} />
          <LeadAuditPanel leadId={id} canView={isAdmin || user?.role === 'sales_manager'} />
        </main>

        <aside className="xl:col-span-3 order-3">
          {['admin', 'sales_manager', 'team_leader'].includes(user?.role) && (
            <div className="mb-4 rounded-xl border border-subtle bg-surface/80 p-3 space-y-2">
              {['lost', 'booked_from_another_company'].includes(lead.status) && (
                <Button type="button" variant="teal" className="w-full" onClick={() => setReactivationMode('reactivate')}>
                  Reactivate Lead
                </Button>
              )}
              {lead.status === 'reactivated' && (
                <Button type="button" variant="outline" className="w-full" onClick={() => setReactivationMode('reassign')}>
                  Reassign Reactivated Lead
                </Button>
              )}
            </div>
          )}
          {['admin', 'sales_manager', 'team_leader'].includes(user?.role) && lead?.reactivation?.isReactivated && (
            <div className="mb-4 rounded-xl border border-subtle bg-surface/80 p-3">
              <Button type="button" variant="outline" className="w-full" onClick={() => setReactivationMode('stage')}>
                Update Reactivation Stage
              </Button>
            </div>
          )}
          {hasDuplicates && (isAdmin || user?.role === 'sales_manager') ? (
            <div className="mb-4">
              <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => setMergeOpen(true)}>
                Merge Duplicate Lead
              </Button>
            </div>
          ) : null}
          <LeadActionPanel
            lead={lead}
            leadId={id}
            onAddFollowUp={canCreateFollowUp ? () => setFollowUpModalOpen(true) : undefined}
            canCreateFollowUp={canCreateFollowUp}
            canEditLead={canEditLead}
            editHref={canEditLead ? `/leads/${id}/edit` : undefined}
            onLogCallNote={() => setCallNoteOpen(true)}
            onAssign={userCanAssignLeads ? () => openAssign(lead) : undefined}
          />
        </aside>
      </div>

      {userCanAssignLeads && (
        <AdminAssignLeadModal
          open={!!assignModal}
          lead={assignModal}
          assignees={assignees}
          loading={assigneesLoading}
          onClose={closeAssign}
          onAssign={handleAssign}
          allowedRoles={assignAllowedRoles(user?.role)}
        />
      )}

      <CallNoteModal
        open={callNoteOpen}
        onClose={() => setCallNoteOpen(false)}
        leadId={id}
        onSaved={refreshLead}
      />

      <MergeLeadModal
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        targetLead={lead}
        onMerged={refreshLead}
      />

      <ReactivationActionsModal
        open={!!reactivationMode}
        mode={reactivationMode || 'reactivate'}
        lead={lead}
        executives={reactivationExecs}
        onClose={() => setReactivationMode('')}
        onSubmit={handleReactivationAction}
      />
    </motion.div>
  );
}
