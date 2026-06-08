import {
  UserPlus,
  UserCheck,
  Phone,
  MessageCircle,
  CalendarPlus,
  FileText,
  RefreshCw,
  Trophy,
} from 'lucide-react';

export const PIPELINE_STAGES = [
  { value: 'new', label: 'New Lead' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'working_progress', label: 'Working Progress' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'quotation_sent', label: 'Quotation Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'reactivated', label: 'Reactivated' },
  { value: 'converted', label: 'Converted' },
  { value: 'booked_from_another_company', label: 'Booked From Another Company' },
];

export const ACTIVITY_CONFIG = {
  lead_created: { label: 'Lead Created', icon: UserPlus, color: 'bg-blue-500/10 text-blue-600' },
  lead_assigned: { label: 'Lead Assigned', icon: UserCheck, color: 'bg-violet-500/10 text-violet-600' },
  call_made: { label: 'Call Made', icon: Phone, color: 'bg-emerald-500/10 text-emerald-600' },
  whatsapp_sent: { label: 'WhatsApp Sent', icon: MessageCircle, color: 'bg-green-500/10 text-green-600' },
  followup_added: { label: 'Follow Up Added', icon: CalendarPlus, color: 'bg-amber-500/10 text-amber-600' },
  followup_completed: { label: 'Follow Up Completed', icon: CalendarPlus, color: 'bg-emerald-500/10 text-emerald-600' },
  quotation_sent: { label: 'Quotation Sent', icon: FileText, color: 'bg-orange-500/10 text-orange-600' },
  lead_reactivated: { label: 'Lead Reactivated', icon: RefreshCw, color: 'bg-teal-500/10 text-teal-700' },
  lead_reassigned: { label: 'Lead Reassigned', icon: UserCheck, color: 'bg-cyan-500/10 text-cyan-700' },
  reactivation_progress: { label: 'Reactivation Progress', icon: RefreshCw, color: 'bg-sky-500/10 text-sky-700' },
  status_changed: { label: 'Status Changed', icon: RefreshCw, color: 'bg-indigo-500/10 text-indigo-600' },
  lead_converted: { label: 'Lead Converted', icon: Trophy, color: 'bg-emerald-500/10 text-emerald-700' },
  lead_edited: { label: 'Lead Edited', icon: RefreshCw, color: 'bg-slate-500/10 text-slate-600' },
  lead_deleted: { label: 'Lead Deleted', icon: RefreshCw, color: 'bg-rose-500/10 text-rose-600' },
  lead_restored: { label: 'Lead Restored', icon: RefreshCw, color: 'bg-teal-500/10 text-teal-700' },
  lead_lost: { label: 'Lead Lost', icon: RefreshCw, color: 'bg-rose-500/10 text-rose-600' },
  quotation_created: { label: 'Quotation Created', icon: FileText, color: 'bg-orange-500/10 text-orange-600' },
  quotation_approved: { label: 'Quotation Approved', icon: FileText, color: 'bg-emerald-500/10 text-emerald-700' },
  followup_missed: { label: 'Follow-up Missed', icon: CalendarPlus, color: 'bg-rose-500/10 text-rose-600' },
  sla_breached: { label: 'SLA Breached', icon: RefreshCw, color: 'bg-rose-500/10 text-rose-700' },
};

const FOLLOWUP_CATEGORY_LABELS = {
  warm: 'Warm',
  cold: 'Cold',
  converted: 'Converted',
  expected_conv: 'Expected Conv.',
};

export function followUpToActivity(f, fallbackUser = 'User') {
  const category = FOLLOWUP_CATEGORY_LABELS[f.category] || f.category || 'Warm';
  const typeLabel = (f.type || 'call').replace(/_/g, ' ');
  const when = f.scheduledAt
    ? new Date(f.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '';
  const remarks = f.notes || f.outcome || '';
  const noteParts = [category, typeLabel, when && `Scheduled ${when}`, remarks].filter(Boolean);

  return {
    id: `fu-${f._id || f.id}`,
    type: f.status === 'completed' ? 'followup_completed' : 'followup_added',
    user: f.createdBy?.name || f.assignedTo?.name || fallbackUser,
    date: f.createdAt || f.completedAt || f.scheduledAt || new Date().toISOString(),
    notes: noteParts.join(' · '),
  };
}

export function getLeadDetailData(lead) {
  const agent = lead.assignedTo?.name || 'Unassigned';
  const created = lead.createdAt || new Date().toISOString();

  const activities = [
    {
      id: 'a1',
      type: 'lead_created',
      user: lead.createdBy?.name || 'System',
      date: created,
      notes: `Lead created from ${lead.sourceLabel || lead.source || 'unknown source'}`,
    },
  ];
  if (lead.assignedTo) {
    activities.push({
      id: 'a2',
      type: 'lead_assigned',
      user: lead.assignedManager?.name || lead.assignedTeamLeader?.name || 'Manager',
      date: lead.updatedAt || created,
      notes: `Assigned to ${agent}`,
    });
  }

  const followUpItems = lead.followups || lead.followUps || [];
  followUpItems.forEach((f) => {
    activities.push(followUpToActivity(f, agent));
  });

  const stageHistory = lead.reactivation?.stageHistory || [];
  stageHistory.forEach((item, idx) => {
    const stage = item.stage || 'reactivated';
    const note = item.note || '';
    activities.push({
      id: `react-${idx}-${item.at || idx}`,
      type:
        stage === 'reactivated'
          ? 'lead_reactivated'
          : stage === 'reassigned'
            ? 'lead_reassigned'
            : 'reactivation_progress',
      user: item.by?.name || item.byName || 'System',
      date: item.at || lead.updatedAt || created,
      notes: `${stage.replace(/_/g, ' ')}${note ? ` · ${note}` : ''}`,
    });
  });

  const notesFromDb = (lead.notesList || []).map((n) => ({
    id: n._id,
    user: n.user?.name || 'User',
    message: n.text,
    date: n.createdAt,
    isOwn: false,
  }));

  const legacyNote = lead.notes?.trim()
    ? [{ id: 'legacy-notes', user: agent, message: lead.notes, date: created, isOwn: false }]
    : [];

  const notes = notesFromDb.length ? notesFromDb : legacyNote;

  const followUps = (lead.followups || lead.followUps || []).map((f, i) => ({
    id: f._id || `f-${i}`,
    date: f.scheduledAt,
    status: f.status,
    category: f.category,
    type: f.type,
    remarks: f.notes || f.outcome || '',
  }));

  const quotations = (lead.quotations || []).map((q, i) => ({
    id: q.quoteNumber || q._id || `q-${i}`,
    title: q.packageSnapshot?.name || q.lead?.destination || `${lead.destination} Package`,
    amount: q.pricing?.total ?? lead.budget ?? 0,
    status: q.status,
    sentAt: q.sentAt || q.createdAt || null,
  }));

  return {
    activities,
    notes,
    followUps,
    quotations,
    valueScore: Math.min(
      99,
      Math.round(40 + (lead.budget || 0) / 10000 + (lead.status === 'converted' ? 30 : 10))
    ),
  };
}
