import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import API from '../../api/axios';
import { Button } from '../ui/button';
import { ActionModal } from './LeadActionsMenu';
import {
  LeadDetailHeader,
  LeadStatusPipeline,
  LeadCustomerPanel,
  LeadActivityTimeline,
  LeadNotesSection,
  LeadFollowUpSection,
  LeadQuotationSection,
  LeadActionPanel,
  getLeadDetailData,
} from '../lead-detail';

const STATUSES = [
  'new',
  'contacted',
  'working_progress',
  'follow_up',
  'quotation_sent',
  'negotiation',
  'converted',
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
  const [modalStatus, setModalStatus] = useState('contacted');
  const [modalStatusReason, setModalStatusReason] = useState('');
  const notesRef = useRef(null);

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
        <p className="text-content-muted">Lead not found or not assigned to you</p>
        <Link to="/sales-executive/leads" className="text-sky-600 text-sm mt-2 inline-block hover:underline">
          ← Back to My Leads
        </Link>
      </div>
    );
  }

  const detail = getLeadDetailData({
    ...lead,
    followUps: lead.followups || [],
    quotations: lead.quotations || [],
  });

  const scrollToNotes = () => {
    notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      <Link to="/sales-executive/leads" className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to My Leads
      </Link>

      <LeadDetailHeader lead={lead} />

      <div className="mb-6">
        <LeadStatusPipeline status={lead.status} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <aside className="xl:col-span-3 xl:sticky xl:top-20 space-y-4 order-2 xl:order-1">
          <LeadCustomerPanel lead={lead} />
        </aside>

        <main className="xl:col-span-6 space-y-6 order-1 xl:order-2">
          <LeadActivityTimeline activities={detail.activities} />
          <div ref={notesRef}>
            <LeadNotesSection notes={detail.notes} />
          </div>
          <LeadFollowUpSection
            followUps={lead.followups || detail.followUps}
            lead={lead}
            canCreate
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
          <LeadQuotationSection quotations={lead.quotations || detail.quotations} />
        </main>

        <aside className="xl:col-span-3 order-3">
          <LeadActionPanel
            lead={lead}
            leadId={id}
            canEditLead={false}
            canChangeStatus
            onAddFollowUp={() => setFollowUpModalOpen(true)}
            onAddNote={scrollToNotes}
            onChangeStatus={() => {
              setModalStatus(lead.status || 'new');
              setModalStatusReason(lead.statusReason || '');
              setStatusModalOpen(true);
            }}
            onCreateQuote={() => navigate(`/sales-executive/quotations/new?leadId=${id}`)}
          />
        </aside>
      </div>

      <ActionModal open={statusModalOpen} title="Change Status" onClose={() => setStatusModalOpen(false)}>
        <select
          value={modalStatus}
          onChange={(e) => setModalStatus(e.target.value)}
          className="w-full rounded-xl border border-subtle bg-surface-elevated p-3 text-sm mb-4"
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
          className="w-full rounded-xl border border-subtle bg-surface-elevated p-3 text-sm mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => { setStatusModalOpen(false); setModalStatusReason(''); }}>Cancel</Button>
          <Button onClick={handleChangeStatus} disabled={reasonRequired && !modalStatusReason.trim()}>Update</Button>
        </div>
      </ActionModal>
    </motion.div>
  );
}
