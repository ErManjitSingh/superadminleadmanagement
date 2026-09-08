import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppIcon } from '@/src/components/AppIcon';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingView } from '@/src/components/LoadingView';
import {
  LEAD_STATUS_LABELS,
  getLeadStatusColor,
  getLeadStatusLabel,
} from '@/src/constants/leadStatus';
import { useAuth } from '@/src/context/AuthContext';
import { getErrorMessage } from '@/src/lib/apiClient';
import { getLeadSourceLabel } from '@/src/constants/leadSource';
import {
  addLeadNote,
  deleteLead,
  fetchLeadDetail,
  fetchLeadNotes,
  fetchLeadTimeline,
  updateLead,
  type LeadTimelineItem,
} from '@/src/services/leads';
import {
  createLeadQuotation,
  fetchLeadQuotations,
  getQuotationPackageName,
  getQuotationTotal,
  type Quotation,
} from '@/src/services/quotations';
import { createFollowUp } from '@/src/services/followups';
import { getLeadWebPath, getQuoteBuilderPath } from '@/src/constants/crmMenu';
import { DateTimeField } from '@/src/components/DateTimeField';
import type { Lead, LeadNote, UserRole } from '@/src/types';

const BG = '#F7F8FC';
const PURPLE = '#7C3AED';

const STATUS_OPTIONS = Object.keys(LEAD_STATUS_LABELS).filter((s) => s !== 'converted');

const ACTIVITY_ICON: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  lead_created: { name: 'person-add', color: '#2563EB', bg: '#DBEAFE' },
  lead_assigned: { name: 'people', color: '#7C3AED', bg: '#EDE9FE' },
  call_made: { name: 'call', color: '#059669', bg: '#D1FAE5' },
  whatsapp_sent: { name: 'logo-whatsapp', color: '#16A34A', bg: '#DCFCE7' },
  whatsapp_contact_initiated: { name: 'logo-whatsapp', color: '#16A34A', bg: '#DCFCE7' },
  email_sent: { name: 'mail', color: '#0284C7', bg: '#E0F2FE' },
  followup_created: { name: 'calendar', color: '#D97706', bg: '#FEF3C7' },
  followup_completed: { name: 'checkmark-circle', color: '#059669', bg: '#D1FAE5' },
  followup_missed: { name: 'alert-circle', color: '#E11D48', bg: '#FFE4E6' },
  quotation_created: { name: 'document-text', color: '#EA580C', bg: '#FFEDD5' },
  quotation_sent: { name: 'send', color: '#EA580C', bg: '#FFEDD5' },
  quotation_approved: { name: 'checkmark-done', color: '#059669', bg: '#D1FAE5' },
  status_changed: { name: 'swap-horizontal', color: '#4F46E5', bg: '#E0E7FF' },
  note_added: { name: 'create', color: '#7C3AED', bg: '#EDE9FE' },
  lead_converted: { name: 'trophy', color: '#059669', bg: '#D1FAE5' },
  lead_lost: { name: 'close-circle', color: '#E11D48', bg: '#FFE4E6' },
  payment_received: { name: 'cash', color: '#059669', bg: '#D1FAE5' },
  advance_payment_received: { name: 'cash', color: '#059669', bg: '#D1FAE5' },
};

function digitsOnly(phone?: string) {
  return String(phone || '').replace(/\D/g, '');
}

function noteAuthor(note: LeadNote) {
  if (typeof note.createdBy === 'string') return note.createdBy;
  return note.createdBy?.name || 'You';
}

function activityMeta(item: LeadTimelineItem) {
  const conf = ACTIVITY_ICON[item.type] || {
    name: 'ellipse' as const,
    color: PURPLE,
    bg: '#EDE9FE',
  };
  return conf;
}

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const queryClient = useQueryClient();

  const [noteText, setNoteText] = useState('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpAt, setFollowUpAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [quoteName, setQuoteName] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteDraft, setQuoteDraft] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editBudget, setEditBudget] = useState('');

  const leadQuery = useQuery({
    queryKey: ['lead', role, id],
    queryFn: () => fetchLeadDetail(role!, id!),
    enabled: !!id && !!role,
  });

  const notesQuery = useQuery({
    queryKey: ['lead-notes', role, id],
    queryFn: () => fetchLeadNotes(role!, id!),
    enabled: !!id && !!role,
  });

  const quotesQuery = useQuery({
    queryKey: ['lead-quotations', role, id],
    queryFn: () => fetchLeadQuotations(role!, id!),
    enabled: !!id && !!role,
  });

  const timelineQuery = useQuery({
    queryKey: ['lead-timeline', id],
    queryFn: () => fetchLeadTimeline(id!),
    enabled: !!id,
  });

  if (!role) return <LoadingView />;
  if (leadQuery.isLoading || !leadQuery.data) return <LoadingView />;

  const lead = leadQuery.data as Lead;
  const notes = notesQuery.data || [];
  const quotations = quotesQuery.data || [];
  const timeline = timelineQuery.data || [];
  const statusColor = getLeadStatusColor(lead.status);
  const phone = typeof lead.phone === 'string' ? lead.phone : '';
  const wa = digitsOnly(phone);
  const leadCode =
    lead.leadId != null ? String(lead.leadId) : lead._id?.slice?.(-4) || '';
  const when = lead.updatedAt || lead.createdAt
    ? formatDistanceToNow(parseISO((lead.updatedAt || lead.createdAt)!), { addSuffix: true })
    : '';
  const initial = (lead.name || 'L').charAt(0).toUpperCase();

  const refreshAll = () => {
    leadQuery.refetch();
    notesQuery.refetch();
    quotesQuery.refetch();
    timelineQuery.refetch();
  };

  const invalidateLead = () => {
    queryClient.invalidateQueries({ queryKey: ['lead', role, id] });
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['lead-timeline', id] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updateLead(role, id!, { status }),
    onSuccess: () => {
      invalidateLead();
      setShowStatusPicker(false);
    },
    onError: (error) => Alert.alert('Update failed', getErrorMessage(error)),
  });

  const addNoteMutation = useMutation({
    mutationFn: () => addLeadNote(role, id!, noteText.trim()),
    onSuccess: () => {
      setNoteText('');
      notesQuery.refetch();
      timelineQuery.refetch();
    },
    onError: (error) => Alert.alert('Could not add note', getErrorMessage(error)),
  });

  const followUpMutation = useMutation({
    mutationFn: () =>
      createFollowUp(role!, {
        leadId: id!,
        scheduledAt: followUpAt.toISOString(),
        notes: followUpNotes.trim() || 'Follow-up scheduled from mobile app',
        priority: followUpPriority,
      }),
    onSuccess: () => {
      setShowFollowUpModal(false);
      setFollowUpNotes('');
      setFollowUpPriority('medium');
      Alert.alert(
        'Follow-up created',
        `Scheduled for ${format(followUpAt, 'dd MMM yyyy · h:mm a')}.`
      );
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      timelineQuery.refetch();
    },
    onError: (error) => Alert.alert('Could not schedule', getErrorMessage(error)),
  });

  const openFollowUp = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    setFollowUpAt(d);
    setFollowUpNotes('');
    setFollowUpPriority('medium');
    setShowFollowUpModal(true);
  };

  const quoteMutation = useMutation({
    mutationFn: () =>
      createLeadQuotation(role, {
        leadId: id!,
        packageName: quoteName.trim() || lead.destination || 'Custom Package',
        amount: Number(quoteAmount) || 0,
        notes: quoteNotes.trim() || undefined,
        asDraft: quoteDraft,
      }),
    onSuccess: (created) => {
      setShowQuoteModal(false);
      setQuoteName('');
      setQuoteAmount('');
      setQuoteNotes('');
      setQuoteDraft(false);
      quotesQuery.refetch();
      invalidateLead();
      const qid = created?._id;
      Alert.alert('Quotation saved', quoteDraft ? 'Draft saved.' : 'Quotation created.', [
        ...(qid ? [{ text: 'View PDF', onPress: () => router.push(`/quotation/${qid}`) }] : []),
        { text: 'OK' },
      ]);
    },
    onError: (error) => Alert.alert('Could not create quotation', getErrorMessage(error)),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateLead(role, id!, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        destination: editDestination.trim(),
        budget: editBudget ? Number(editBudget) : undefined,
      }),
    onSuccess: () => {
      setShowEditModal(false);
      invalidateLead();
    },
    onError: (error) => Alert.alert('Update failed', getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLead(role, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      router.back();
    },
    onError: (error) => Alert.alert('Delete failed', getErrorMessage(error)),
  });

  const openCall = () => {
    if (!phone) return Alert.alert('No phone', 'This lead has no phone number.');
    Linking.openURL(`tel:${phone}`);
  };

  const openWhatsApp = () => {
    if (!wa) return Alert.alert('No phone', 'This lead has no phone number.');
    const num = wa.length === 10 ? `91${wa}` : wa;
    Linking.openURL(`https://wa.me/${num}`);
  };

  const openEdit = () => {
    setEditName(lead.name || '');
    setEditPhone(phone);
    setEditEmail(typeof lead.email === 'string' ? lead.email : '');
    setEditDestination(typeof lead.destination === 'string' ? lead.destination : '');
    setEditBudget(lead.budget ? String(lead.budget) : '');
    setShowEditModal(true);
  };

  const openFullQuoteBuilder = () => {
    router.push({
      pathname: '/quotation/create',
      params: { leadId: id },
    });
  };

  const openQuote = () => {
    openFullQuoteBuilder();
  };

  const markConverted = () => {
    router.push({ pathname: '/lead/convert', params: { id: String(id) } });
  };

  const confirmDelete = () => {
    if (role !== 'admin') {
      Alert.alert('Not allowed', 'Only admin can delete leads from the app.');
      return;
    }
    Alert.alert('Delete lead?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </Pressable>
          <View style={{ flex: 1, paddingHorizontal: 10 }}>
            <Text style={styles.topTitle}>Lead Details</Text>
            <Text style={styles.topSub}>View and manage lead information</Text>
          </View>
          <Pressable onPress={() => setShowMore(true)} style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color="#475569" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={leadQuery.isRefetching} onRefresh={refreshAll} tintColor={PURPLE} />
          }
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <LinearGradient colors={['#EDE9FE', '#E0E7FF', '#DBEAFE']} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.onlineDot} />
              </View>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.leadName} numberOfLines={1}>
                  {lead.name || 'Lead'}
                </Text>
                <View style={styles.idRow}>
                  <Text style={styles.leadId}>#{leadCode}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {getLeadStatusLabel(lead.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.heroRight}>
                {when ? (
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={12} color="#64748B" />
                    <Text style={styles.timeText}>{when}</Text>
                  </View>
                ) : null}
                <View style={styles.heroMark}>
                  <Text style={styles.heroMarkText}>
                    {(lead.name || 'L').charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Quick actions */}
          <View style={styles.actionsRow}>
            <QuickAction
              label="Call"
              icon="call"
              color="#059669"
              bg="#D1FAE5"
              onPress={openCall}
            />
            <QuickAction
              label="WhatsApp"
              icon="logo-whatsapp"
              color="#16A34A"
              bg="#DCFCE7"
              onPress={openWhatsApp}
            />
            <QuickAction
              label="Follow-up"
              icon="calendar"
              color={PURPLE}
              bg="#EDE9FE"
              onPress={openFollowUp}
            />
            <QuickAction
              label="More"
              icon="ellipsis-horizontal"
              color="#2563EB"
              bg="#DBEAFE"
              onPress={() => setShowMore(true)}
            />
          </View>

          {/* Lead Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="swap-horizontal" size={16} color={PURPLE} />
                </View>
                <Text style={styles.cardTitle}>Lead Information</Text>
              </View>
              <Pressable onPress={openEdit} style={styles.editBtn}>
                <Ionicons name="pencil" size={14} color={PURPLE} />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>

            <InfoRow icon="person-outline" label="Full Name" value={lead.name || '—'} />
            <InfoRow icon="pricetag-outline" label="Lead ID" value={`#${leadCode}`} />
            <InfoRow
              icon="location-outline"
              label="Destination"
              value={typeof lead.destination === 'string' && lead.destination ? lead.destination : '—'}
            />
            <InfoRow
              icon="wallet-outline"
              label="Budget"
              value={lead.budget ? `₹${Number(lead.budget).toLocaleString('en-IN')}` : '—'}
            />
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={typeof lead.email === 'string' && lead.email ? lead.email : '—'}
            />
            <InfoRow icon="call-outline" label="Phone" value={phone || '—'} />
            <InfoRow
              icon="link-outline"
              label="Source"
              value={getLeadSourceLabel(
                typeof lead.source === 'string' ? lead.source : null,
                typeof (lead as { sourceLabel?: string }).sourceLabel === 'string'
                  ? (lead as { sourceLabel?: string }).sourceLabel
                  : null
              )}
            />
            <InfoRow
              icon="calendar-outline"
              label="Created On"
              value={
                lead.createdAt
                  ? format(parseISO(lead.createdAt), 'dd MMM yyyy, h:mm a')
                  : '—'
              }
              last
            />
          </View>

          {/* Lead Status */}
          <View style={styles.statusCard}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: '#DDD6FE' }]}>
                  <Ionicons name="bar-chart" size={16} color={PURPLE} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Lead Status</Text>
                  <Text style={styles.cardSub}>Update the current status of this lead</Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={() => setShowStatusPicker((v) => !v)}
              style={styles.statusSelect}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.statusSelectText} numberOfLines={1}>
                {getLeadStatusLabel(lead.status)}
              </Text>
              <Ionicons
                name={showStatusPicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#64748B"
              />
            </Pressable>
          </View>
          {showStatusPicker ? (
            <View style={styles.statusGrid}>
              {STATUS_OPTIONS.map((status) => {
                const active = lead.status === status;
                const color = getLeadStatusColor(status);
                return (
                  <Pressable
                    key={status}
                    onPress={() => updateStatusMutation.mutate(status)}
                    style={[
                      styles.statusOption,
                      active && { backgroundColor: color, borderColor: color },
                    ]}
                  >
                    <Text style={[styles.statusOptionText, active && { color: '#fff' }]}>
                      {LEAD_STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Quotations */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="document-text" size={16} color="#EA580C" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Quotations</Text>
                  <Text style={styles.cardSub}>Create and track package quotes</Text>
                </View>
              </View>
              <Pressable onPress={openQuote} style={styles.addNoteBtn}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addNoteBtnText}>Create</Text>
              </Pressable>
            </View>

            <Pressable onPress={openFullQuoteBuilder} style={styles.fullBuilderBtn}>
              <AppIcon name="document-text-outline" size={16} color={PURPLE} />
              <Text style={styles.fullBuilderText}>Create quotation in app</Text>
            </Pressable>

            {quotations.length ? (
              quotations.map((q: Quotation) => {
                const total = getQuotationTotal(q);
                const qStatus = (q.status || 'draft').replace(/_/g, ' ');
                return (
                  <Pressable
                    key={q._id}
                    style={styles.quoteRow}
                    onPress={() => router.push(`/quotation/${q._id}`)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quoteTitle} numberOfLines={1}>
                        {q.quoteNumber || getQuotationPackageName(q)}
                      </Text>
                      <Text style={styles.quoteMeta}>
                        {getQuotationPackageName(q)} · {qStatus}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={styles.quoteAmount}>
                        {total > 0 ? `₹${total.toLocaleString('en-IN')}` : '—'}
                      </Text>
                      <Text style={styles.pdfLink}>View PDF</Text>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <EmptyState
                icon="document-outline"
                title="No quotations yet"
                subtitle="Create a quotation for this lead"
              />
            )}
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="document" size={16} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Notes</Text>
                  <Text style={styles.cardSub}>Add notes, comments or observations</Text>
                </View>
              </View>
              <Pressable
                onPress={() => noteText.trim() && addNoteMutation.mutate()}
                style={styles.addNoteBtn}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addNoteBtnText}>Add Note</Text>
              </Pressable>
            </View>

            <View style={styles.noteInputRow}>
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Write a note..."
                placeholderTextColor="#94A3B8"
                style={styles.noteInput}
                multiline
              />
              <Pressable
                onPress={() => noteText.trim() && addNoteMutation.mutate()}
                style={styles.noteSend}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </Pressable>
            </View>

            {notes.length ? (
              notes.map((note) => (
                <View key={note._id} style={styles.noteCard}>
                  <Text style={styles.noteContent}>{note.content}</Text>
                  <Text style={styles.noteMeta}>
                    {noteAuthor(note)} ·{' '}
                    {note.createdAt
                      ? format(parseISO(note.createdAt), 'dd MMM yyyy, h:mm a')
                      : ''}
                  </Text>
                </View>
              ))
            ) : (
              <EmptyState
                icon="document-text-outline"
                title="No notes yet"
                subtitle="Add your first note to keep track of conversations and updates."
              />
            )}
          </View>

          {/* Activity Timeline */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="time" size={16} color="#4F46E5" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Activity Timeline</Text>
                  <Text style={styles.cardSub}>All updates for this lead</Text>
                </View>
              </View>
            </View>

            {timelineQuery.isLoading ? (
              <Text style={styles.loadingText}>Loading timeline...</Text>
            ) : timeline.length ? (
              timeline.map((item, index) => {
                const conf = activityMeta(item);
                const isLast = index === timeline.length - 1;
                return (
                  <View key={item.id || `${item.type}-${index}`} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View style={[styles.timelineIcon, { backgroundColor: conf.bg }]}>
                        <AppIcon name={conf.name} size={14} color={conf.color} />
                      </View>
                      {!isLast ? <View style={styles.timelineLine} /> : null}
                    </View>
                    <View style={[styles.timelineBody, isLast && { borderBottomWidth: 0 }]}>
                      <Text style={styles.timelineTitle}>
                        {item.title || item.type.replace(/_/g, ' ')}
                      </Text>
                      {item.description || item.notes ? (
                        <Text style={styles.timelineDesc} numberOfLines={3}>
                          {item.description || item.notes}
                        </Text>
                      ) : null}
                      <Text style={styles.timelineMeta}>
                        {item.user || 'System'}
                        {item.date
                          ? ` · ${format(parseISO(item.date), 'dd MMM yyyy, h:mm a')}`
                          : ''}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <EmptyState
                icon="time-outline"
                title="No activity yet"
                subtitle="Calls, notes, quotations and status changes will appear here."
              />
            )}
          </View>

          {/* Footer actions */}
          <View style={styles.footerRow}>
            <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={styles.deleteText}>Delete Lead</Text>
            </Pressable>
            <Pressable onPress={markConverted} style={styles.convertBtn}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.convertText}>Mark as Converted</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* More sheet */}
      <Modal visible={showMore} transparent animationType="fade" onRequestClose={() => setShowMore(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowMore(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>More actions</Text>
            <SheetItem
              icon="document-text-outline"
              label="Create Quotation"
              onPress={() => {
                setShowMore(false);
                openQuote();
              }}
            />
            <SheetItem
              icon="globe-outline"
              label="Open Full CRM Lead"
              onPress={() => {
                setShowMore(false);
                router.push({
                  pathname: '/crm-web',
                  params: { path: getLeadWebPath(role, id), title: lead.name || 'Lead' },
                });
              }}
            />
            <SheetItem
              icon="calendar-outline"
              label="Schedule Follow-up"
              onPress={() => {
                setShowMore(false);
                openFollowUp();
              }}
            />
            <SheetItem
              icon="create-outline"
              label="Edit Lead"
              onPress={() => {
                setShowMore(false);
                openEdit();
              }}
            />
            <SheetItem
              icon="close"
              label="Cancel"
              onPress={() => setShowMore(false)}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Follow-up schedule modal */}
      <Modal
        visible={showFollowUpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFollowUpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formSheet}>
            <Text style={styles.sheetTitle}>Schedule Follow-up</Text>
            <DateTimeField
              label="Date & time"
              mode="datetime"
              value={followUpAt}
              onChange={setFollowUpAt}
              minimumDate={new Date()}
            />
            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setFollowUpPriority(p)}
                  style={[
                    styles.priorityChip,
                    followUpPriority === p && styles.priorityChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      followUpPriority === p && styles.priorityTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              value={followUpNotes}
              onChangeText={setFollowUpNotes}
              placeholder="What to discuss / reminder…"
              placeholderTextColor="#94A3B8"
              style={[styles.field, { minHeight: 80 }]}
              multiline
            />
            <View style={styles.formActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowFollowUpModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.saveBtn}
                disabled={followUpMutation.isPending}
                onPress={() => followUpMutation.mutate()}
              >
                <Text style={styles.saveText}>
                  {followUpMutation.isPending ? 'Saving…' : 'Schedule'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quotation modal */}
      <Modal visible={showQuoteModal} transparent animationType="slide" onRequestClose={() => setShowQuoteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.formSheet}>
            <Text style={styles.sheetTitle}>Create Quotation</Text>
            <Text style={styles.fieldLabel}>Package / Destination</Text>
            <TextInput
              value={quoteName}
              onChangeText={setQuoteName}
              placeholder="e.g. Shimla Manali 5N/6D"
              placeholderTextColor="#94A3B8"
              style={styles.field}
            />
            <Text style={styles.fieldLabel}>Total Amount (₹)</Text>
            <TextInput
              value={quoteAmount}
              onChangeText={setQuoteAmount}
              placeholder="25000"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
              style={styles.field}
            />
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              value={quoteNotes}
              onChangeText={setQuoteNotes}
              placeholder="Hotel category, inclusions..."
              placeholderTextColor="#94A3B8"
              style={[styles.field, { minHeight: 72 }]}
              multiline
            />
            <Pressable
              onPress={() => setQuoteDraft((v) => !v)}
              style={styles.draftToggle}
            >
              <Ionicons
                name={quoteDraft ? 'checkbox' : 'square-outline'}
                size={20}
                color={PURPLE}
              />
              <Text style={styles.draftText}>Save as draft</Text>
            </Pressable>
            <View style={styles.formActions}>
              <Pressable onPress={() => setShowQuoteModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!Number(quoteAmount)) {
                    Alert.alert('Amount required', 'Enter quotation amount.');
                    return;
                  }
                  quoteMutation.mutate();
                }}
                style={styles.saveBtn}
                disabled={quoteMutation.isPending}
              >
                <Text style={styles.saveText}>
                  {quoteMutation.isPending ? 'Saving...' : 'Create'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}>
            <View style={styles.formSheet}>
              <Text style={styles.sheetTitle}>Edit Lead</Text>
              {(
                [
                  ['Full Name', editName, setEditName],
                  ['Phone', editPhone, setEditPhone],
                  ['Email', editEmail, setEditEmail],
                  ['Destination', editDestination, setEditDestination],
                  ['Budget', editBudget, setEditBudget],
                ] as const
              ).map(([label, value, setter]) => (
                <View key={label}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    value={value}
                    onChangeText={setter}
                    keyboardType={label === 'Budget' || label === 'Phone' ? 'numeric' : 'default'}
                    placeholderTextColor="#94A3B8"
                    style={styles.field}
                  />
                </View>
              ))}
              <View style={styles.formActions}>
                <Pressable onPress={() => setShowEditModal(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => editMutation.mutate()}
                  style={styles.saveBtn}
                  disabled={editMutation.isPending}
                >
                  <Text style={styles.saveText}>
                    {editMutation.isPending ? 'Saving...' : 'Save'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function QuickAction({
  label,
  icon,
  color,
  bg,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.actionCard, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={16} color="#94A3B8" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function SheetItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.sheetItem}>
      <Ionicons name={icon} size={20} color="#334155" />
      <Text style={styles.sheetItemText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  topSub: { marginTop: 1, fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  hero: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#fff' },
  onlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  leadName: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  idRow: { marginTop: 2 },
  leadId: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  statusPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  heroRight: { alignItems: 'flex-end', width: 110 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  timeText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  heroMark: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMarkText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7C3AED',
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: { fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  cardSub: { marginTop: 2, fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editBtnText: { color: PURPLE, fontWeight: '700', fontSize: 13 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: { width: 88, fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  infoValue: { flex: 1, textAlign: 'right', fontSize: 14, color: '#0F172A', fontWeight: '600' },
  statusCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: 150,
  },
  statusSelectText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#0F172A' },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -6,
    marginBottom: 14,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusOptionText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addNoteBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  noteInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 8 },
  noteInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontSize: 14,
  },
  noteSend: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  noteContent: { fontSize: 14, color: '#0F172A', lineHeight: 20 },
  noteMeta: { marginTop: 6, fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quoteTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  quoteMeta: { marginTop: 2, fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  quoteAmount: { fontSize: 14, fontWeight: '800', color: PURPLE },
  pdfLink: { fontSize: 11, fontWeight: '700', color: '#EA580C' },
  fullBuilderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  fullBuilderText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#C2410C' },
  loadingText: { textAlign: 'center', color: '#94A3B8', paddingVertical: 16 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineRail: { width: 32, alignItems: 'center' },
  timelineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
    minHeight: 16,
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', textTransform: 'capitalize' },
  timelineDesc: { marginTop: 4, fontSize: 13, color: '#64748B', lineHeight: 18 },
  timelineMeta: { marginTop: 6, fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  footerRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 14,
  },
  deleteText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  convertBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 14,
  },
  convertText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  formSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetItemText: { fontSize: 15, fontWeight: '600', color: '#334155' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, marginTop: 8 },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  priorityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priorityChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  priorityText: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'capitalize' },
  priorityTextActive: { color: '#fff' },
  field: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  draftToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  draftText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cancelText: { fontWeight: '700', color: '#475569' },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: PURPLE,
  },
  saveText: { fontWeight: '700', color: '#fff' },
});
