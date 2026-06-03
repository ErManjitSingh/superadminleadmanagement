import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  LeadNotesSection,
  LeadFollowUpSection,
  LeadQuotationSection,
  LeadActionPanel,
  ReactivationActionsModal,
  getLeadDetailData,
} from '../components/lead-detail';

export default function LeadDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { can } = usePermissions();
  const isAdmin = user?.role === 'admin';
  const userCanAssignLeads = canAssignLeads(user?.role);
  const canCreateFollowUp = canManageFollowUps(user);
  const canEditLead = can('leads', 'edit');
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [reactivationMode, setReactivationMode] = useState('');
  const [reactivationExecs, setReactivationExecs] = useState([]);
  const notesRef = useRef(null);

  const loadLead = useCallback(({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    return API.get(`/leads/${id}`, { skipSuccessToast: true })
      .then((res) => setLead(res.data))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  useEffect(() => {
    if (!['admin', 'sales_manager', 'team_leader'].includes(user?.role)) return;
    API.get('/leads/assignees', { skipSuccessToast: true, skipErrorToast: true })
      .then((res) => setReactivationExecs(res.data?.salesExecutives || []))
      .catch(() => setReactivationExecs([]));
  }, [user?.role]);

  useDataRefresh(['leads'], loadLead);

  const { assignees, assigneesLoading, assignModal, openAssign, closeAssign, handleAssign } = useLeadAssign({
    onAssigned: () => loadLead(),
  });

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

  const detail = getLeadDetailData(lead);

  const scrollToNotes = () => {
    notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    await loadLead({ silent: true });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pb-8">
      <LeadDetailHeader lead={lead} />

      <div className="mb-6">
        <LeadStatusPipeline status={lead.status} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left — Customer Profile */}
        <aside className="xl:col-span-3 xl:sticky xl:top-20 space-y-4 order-2 xl:order-1">
          <LeadCustomerPanel lead={lead} valueScore={detail.valueScore} />
        </aside>

        {/* Center — Timeline, Notes, Follow-ups, Quotations */}
        <main className="xl:col-span-6 space-y-6 order-1 xl:order-2">
          <LeadActivityTimeline activities={detail.activities} />
          <div ref={notesRef}>
            <LeadNotesSection notes={detail.notes} />
          </div>
          <LeadFollowUpSection
            followUps={lead.followups || detail.followUps}
            lead={lead}
            canCreate={canCreateFollowUp}
            onRefresh={loadLead}
            onFollowUpAdded={(created) => {
              setLead((prev) =>
                prev
                  ? { ...prev, followups: [created, ...(prev.followups || [])] }
                  : prev
              );
            }}
            modalOpen={followUpModalOpen}
            onModalOpenChange={setFollowUpModalOpen}
          />
          <LeadQuotationSection quotations={detail.quotations} />
        </main>

        {/* Right — Quick Actions */}
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
          <LeadActionPanel
            lead={lead}
            leadId={id}
            onAddFollowUp={canCreateFollowUp ? () => setFollowUpModalOpen(true) : undefined}
            canCreateFollowUp={canCreateFollowUp}
            canEditLead={canEditLead}
            editHref={canEditLead ? `/leads/${id}/edit` : undefined}
            onAddNote={scrollToNotes}
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

      <ReactivationActionsModal
        open={!!reactivationMode}
        mode={reactivationMode || 'reactivate'}
        executives={reactivationExecs}
        onClose={() => setReactivationMode('')}
        onSubmit={handleReactivationAction}
      />
    </motion.div>
  );
}
