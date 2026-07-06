import { useCallback, useEffect, useState } from 'react';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../api/axios';
import { Button } from '../ui/button';
import { ActionModal } from './LeadActionsMenu';
import { LeadDetailLayout } from '../lead-detail';
import AddFollowUpModal from '../followups/AddFollowUpModal';
import { createExecutiveFollowUp, buildFollowUpPayload } from '../followups/followupApi';
import { useLeadActivities } from '../../features/leads/hooks/useLeadActivities';
import { isLeadStatusLocked, canConvertLead } from '../../utils/leadUtils';

import ConvertLeadModal from '../payments/ConvertLeadModal';

const STATUSES = [
  'new',
  'contacted',
  'working_progress',
  'follow_up',
  'quotation_sent',
  'negotiation',
  'lost',
  'booked_from_another_company',
];

export default function ExecutiveLeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('contacted');
  const [modalStatusReason, setModalStatusReason] = useState('');

  const loadLead = useCallback(({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    return API.get(`/sales-executive/leads/${id}`, { skipSuccessToast: true })
      .then((res) => setLead(res.data))
      .catch(() => setLead(null))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
    const main = document.querySelector('[data-workspace-main]');
    main?.scrollTo({ top: 0, left: 0 });
    loadLead();
  }, [loadLead]);

  useDataRefresh(['leads'], loadLead);

  const { activities, timelineLoading } = useLeadActivities(
    lead
      ? {
          ...lead,
          followUps: lead.followups || [],
          quotations: lead.quotations || [],
        }
      : null,
    id
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-slate-100" />
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3 h-[500px] rounded-2xl bg-slate-100" />
          <div className="xl:col-span-6 h-[500px] rounded-2xl bg-slate-100" />
          <div className="xl:col-span-3 h-[400px] rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-2xl border border-subtle bg-white p-12 text-center shadow-sm">
        <p className="text-content-muted">Lead not found or not assigned to you</p>
        <Link to="/sales-executive/leads/all" className="text-violet-600 text-sm mt-2 inline-block hover:underline">
          ← Back to My Leads
        </Link>
      </div>
    );
  }

  const handleChangeStatus = async () => {
    if (!id) return;
    await API.put(`/sales-executive/leads/${id}`, {
      status: modalStatus,
      statusReason: modalStatusReason,
    });
    setStatusModalOpen(false);
    setModalStatusReason('');
    await loadLead();
  };
  const reasonRequired = ['lost', 'booked_from_another_company'].includes(modalStatus);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pb-8">
      <LeadDetailLayout
        lead={lead}
        leadId={id}
        activities={activities}
        timelineLoading={timelineLoading}
        relatedBasePath="/sales-executive/leads"
        backHref="/sales-executive/leads/all"
        backLabel="Back to Leads"
        contactEndpoint="/sales-executive/leads"
        onCreateQuote={() => navigate(`/sales-executive/quotations/new?leadId=${id}`)}
        onScheduleFollowUp={() => setFollowUpModalOpen(true)}
        onContactLogged={loadLead}
        onEmailSent={loadLead}
        onChangeStatus={!isLeadStatusLocked(lead.status) ? () => {
          setModalStatus(lead.status || 'new');
          setModalStatusReason(lead.statusReason || '');
          setStatusModalOpen(true);
        } : undefined}
        onConvertLead={!isLeadStatusLocked(lead.status) ? () => setConvertModalOpen(true) : undefined}
        canConvertLead={canConvertLead(lead.status)}
        canChangeStatus={!isLeadStatusLocked(lead.status)}
      />

      <ConvertLeadModal
        open={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        leadId={id}
        onSuccess={async (result) => {
          setConvertModalOpen(false);
          await loadLead();
          if (result?.booking?._id) {
            navigate(`/operations-manager/booking/${result.booking._id}`);
          }
        }}
      />

      <AddFollowUpModal
        open={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        fixedLeadId={lead._id}
        fixedLeadName={lead.name}
        onSubmit={async (data) => {
          await createExecutiveFollowUp(buildFollowUpPayload({ ...data, lead: lead._id }));
          setFollowUpModalOpen(false);
          await loadLead();
        }}
      />

      <ActionModal open={statusModalOpen} title="Change Status" onClose={() => setStatusModalOpen(false)}>
        <select
          value={modalStatus}
          onChange={(e) => setModalStatus(e.target.value)}
          className="w-full rounded-xl border border-subtle bg-white p-3 text-sm mb-4"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <textarea
          value={modalStatusReason}
          onChange={(e) => setModalStatusReason(e.target.value)}
          rows={3}
          placeholder="Reason for status change"
          className="w-full rounded-xl border border-subtle bg-white p-3 text-sm mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => { setStatusModalOpen(false); setModalStatusReason(''); }}>Cancel</Button>
          <Button onClick={handleChangeStatus} disabled={reasonRequired && !modalStatusReason.trim()}>Update</Button>
        </div>
      </ActionModal>
    </motion.div>
  );
}
