import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import API from '../../api/axios';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import WhatsAppInboxLayout from './WhatsAppInboxLayout';
import WhatsAppLeadList from './WhatsAppLeadList';
import WhatsAppConversation from './WhatsAppConversation';
import WhatsAppLeadInfoPanel from './WhatsAppLeadInfoPanel';
import AddNoteModal from './modals/AddNoteModal';
import ChangeStatusModal from './modals/ChangeStatusModal';
import AssignLeadModal from './modals/AssignLeadModal';
import CreateFollowUpModal from './modals/CreateFollowUpModal';
import { createExecutiveFollowUp, buildFollowUpPayload } from '../followups/followupApi';

export default function WhatsAppLeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const [modals, setModals] = useState({ note: false, status: false, assign: false, followup: false });

  const conversationsQuery = useQuery({
    queryKey: ['whatsapp', 'conversations', { statusFilter, search }],
    queryFn: async () => {
      const params = { page: 1, limit: 25 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await API.get('/whatsapp/conversations', { params, skipSuccessToast: true });
      return res.data?.data || [];
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const executivesQuery = useQuery({
    queryKey: ['whatsapp', 'executives'],
    queryFn: async () => {
      const res = await API.get('/whatsapp/executives', { skipSuccessToast: true });
      return res.data || [];
    },
    enabled: modals.assign,
    staleTime: 5 * 60_000,
  });

  const detailsQuery = useQuery({
    queryKey: ['whatsapp', 'details', selected?.leadId],
    queryFn: async () => {
      const leadId = selected.leadId;
      const [msgRes, noteRes, fuRes] = await Promise.all([
        API.get(`/whatsapp/messages/${leadId}`, { skipSuccessToast: true }),
        API.get(`/whatsapp/notes/${leadId}`, { skipSuccessToast: true }),
        API.get(`/whatsapp/followups/${leadId}`, { skipSuccessToast: true }),
        API.put(`/whatsapp/read/${leadId}`, { skipSuccessToast: true }),
      ]);
      return {
        messages: msgRes.data,
        notes: noteRes.data,
        followups: fuRes.data,
      };
    },
    enabled: !!selected?.leadId,
    staleTime: 15_000,
  });

  const conversations = conversationsQuery.data ?? [];
  const messages = detailsQuery.data?.messages ?? [];
  const notes = detailsQuery.data?.notes ?? [];
  const followups = detailsQuery.data?.followups ?? [];
  const executives = executivesQuery.data ?? [];
  const loading = conversationsQuery.isLoading && !conversationsQuery.data;
  const messagesLoading = detailsQuery.isLoading && !!selected?.leadId;

  const refreshConversations = () => {
    queryClient.invalidateQueries({ queryKey: ['whatsapp', 'conversations'] });
  };

  useDataRefresh(['whatsapp', 'leads'], () => {
    refreshConversations();
    if (selected?.leadId) {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'details', selected.leadId] });
    }
  });

  const handleSelect = (conv) => {
    setSelected(conv);
    setMobileView('chat');
  };

  const handleSend = async (payload) => {
    if (!selected) return;
    await API.post('/whatsapp/messages', { leadId: selected.leadId, ...payload });
    queryClient.invalidateQueries({ queryKey: ['whatsapp', 'details', selected.leadId] });
    refreshConversations();
  };

  const handleUpdateLead = async (updates) => {
    if (!selected) return;
    const res = await API.put(`/whatsapp/leads/${selected.leadId}`, updates);
    setSelected((prev) => ({ ...prev, lead: res.data }));
    refreshConversations();
  };

  const handleAddNote = async (text) => {
    if (!selected) return;
    await API.post('/whatsapp/notes', { leadId: selected.leadId, text });
    queryClient.invalidateQueries({ queryKey: ['whatsapp', 'details', selected.leadId] });
  };

  const handleCreateFollowUp = async (data) => {
    if (!selected) throw new Error('No lead selected');
    await createExecutiveFollowUp(
      buildFollowUpPayload({
        ...data,
        lead: selected.leadId,
        remarks: data.notes,
        category: data.category || 'warm',
      })
    );
    queryClient.invalidateQueries({ queryKey: ['whatsapp', 'details', selected.leadId] });
    await handleUpdateLead({ nextFollowUp: data.scheduledAt });
  };

  const handleAction = (key) => {
    if (!selected) return;
    const lead = selected.lead;
    switch (key) {
      case 'call':
        window.open(`tel:${lead.phone}`, '_self');
        break;
      case 'followup':
        setModals((m) => ({ ...m, followup: true }));
        break;
      case 'note':
        setModals((m) => ({ ...m, note: true }));
        break;
      case 'quotation':
        navigate(`/quotations/new?leadId=${lead._id}`);
        break;
      case 'status':
        setModals((m) => ({ ...m, status: true }));
        break;
      case 'assign':
        setModals((m) => ({ ...m, assign: true }));
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-2 mb-0"
    >
      <WhatsAppInboxLayout
        mobileView={mobileView}
        className="h-[calc(100dvh-5.5rem)] lg:h-[calc(100dvh-6rem)]"
        listPanel={
          <WhatsAppLeadList
            conversations={conversations}
            selectedId={selected?.leadId}
            onSelect={handleSelect}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            loading={loading}
          />
        }
        chatPanel={
          <WhatsAppConversation
            lead={selected?.lead}
            messages={messages}
            loading={messagesLoading}
            onSend={handleSend}
            onBack={() => { setMobileView('list'); setSelected(null); }}
            onToggleInfo={() => setMobileView('info')}
            showInfoToggle
          />
        }
        infoPanel={
          <WhatsAppLeadInfoPanel
            lead={selected?.lead}
            notes={notes}
            followups={followups}
            onClose={() => setMobileView('chat')}
            onAction={handleAction}
          />
        }
      />

      <AddNoteModal
        open={modals.note}
        onClose={() => setModals((m) => ({ ...m, note: false }))}
        onSubmit={handleAddNote}
        leadName={selected?.lead?.name}
      />
      <ChangeStatusModal
        open={modals.status}
        onClose={() => setModals((m) => ({ ...m, status: false }))}
        currentStatus={selected?.lead?.status}
        onSubmit={(status) => handleUpdateLead({ status })}
      />
      <AssignLeadModal
        open={modals.assign}
        onClose={() => setModals((m) => ({ ...m, assign: false }))}
        executives={executives}
        currentAssignee={selected?.lead?.assignedTo}
        onSubmit={(assignedTo) => handleUpdateLead({ assignedTo })}
      />
      <CreateFollowUpModal
        open={modals.followup}
        onClose={() => setModals((m) => ({ ...m, followup: false }))}
        onSubmit={handleCreateFollowUp}
        leadName={selected?.lead?.name}
      />
    </motion.div>
  );
}
