import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const [modals, setModals] = useState({ note: false, status: false, assign: false, followup: false });

  const fetchConversations = useCallback(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    params.page = 1;
    params.limit = 25;
    return API.get('/whatsapp/conversations', { params }).then((res) => {
      setConversations(res.data?.data || []);
      return res.data?.data || [];
    });
  }, [statusFilter, search]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchConversations(), API.get('/whatsapp/executives')])
      .then(([, execRes]) => setExecutives(execRes.data))
      .finally(() => setLoading(false));
  }, [fetchConversations]);

  useDataRefresh(['whatsapp', 'leads'], () => {
    fetchConversations().then((list) => {
      if (selected) {
        const updated = list.find((c) => c.leadId === selected.leadId);
        if (updated) setSelected(updated);
      }
    });
  });

  const loadConversationDetails = useCallback(async (leadId) => {
    setMessagesLoading(true);
    try {
      const [msgRes, noteRes, fuRes] = await Promise.all([
        API.get(`/whatsapp/messages/${leadId}`),
        API.get(`/whatsapp/notes/${leadId}`),
        API.get(`/whatsapp/followups/${leadId}`),
        API.put(`/whatsapp/read/${leadId}`),
      ]);
      setMessages(msgRes.data);
      setNotes(noteRes.data);
      setFollowups(fuRes.data);
      fetchConversations();
    } finally {
      setMessagesLoading(false);
    }
  }, [fetchConversations]);

  const handleSelect = (conv) => {
    setSelected(conv);
    setMobileView('chat');
    loadConversationDetails(conv.leadId);
  };

  const handleSend = async (payload) => {
    if (!selected) return;
    const res = await API.post('/whatsapp/messages', { leadId: selected.leadId, ...payload });
    setMessages((prev) => [...prev, res.data]);
    fetchConversations();
  };

  const handleUpdateLead = async (updates) => {
    if (!selected) return;
    const res = await API.put(`/whatsapp/leads/${selected.leadId}`, updates);
    setSelected((prev) => ({ ...prev, lead: res.data }));
    setConversations((prev) =>
      prev.map((c) => (c.leadId === selected.leadId ? { ...c, lead: res.data } : c))
    );
  };

  const handleAddNote = async (text) => {
    if (!selected) return;
    const res = await API.post('/whatsapp/notes', { leadId: selected.leadId, text });
    setNotes((prev) => [res.data, ...prev]);
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
    const fuRes = await API.get(`/whatsapp/followups/${selected.leadId}`);
    setFollowups(fuRes.data);
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
