import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { EmptyState } from '@/src/components/EmptyState';
import { HotBadge, StatusBadge } from '@/src/components/StatusBadge';
import { LoadingView } from '@/src/components/LoadingView';
import { LEAD_STATUS_LABELS } from '@/src/constants/leadStatus';
import { colors, radius, shadows, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { getErrorMessage } from '@/src/lib/apiClient';
import {
  addLeadNote,
  fetchLeadDetail,
  fetchLeadNotes,
  updateLead,
} from '@/src/services/leads';
import { createFollowUp } from '@/src/services/followups';
import type { UserRole } from '@/src/types';

const STATUS_OPTIONS = Object.keys(LEAD_STATUS_LABELS);

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const role = user!.role as UserRole;
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const leadQuery = useQuery({
    queryKey: ['lead', role, id],
    queryFn: () => fetchLeadDetail(role, id!),
    enabled: !!id,
  });

  const notesQuery = useQuery({
    queryKey: ['lead-notes', role, id],
    queryFn: () => fetchLeadNotes(role, id!),
    enabled: !!id,
  });

  const refreshAll = () => {
    leadQuery.refetch();
    notesQuery.refetch();
  };

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updateLead(role, id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', role, id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowStatusPicker(false);
    },
    onError: (error) => Alert.alert('Update failed', getErrorMessage(error)),
  });

  const addNoteMutation = useMutation({
    mutationFn: () => addLeadNote(role, id!, noteText.trim()),
    onSuccess: () => {
      setNoteText('');
      notesQuery.refetch();
    },
    onError: (error) => Alert.alert('Could not add note', getErrorMessage(error)),
  });

  const followUpMutation = useMutation({
    mutationFn: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      return createFollowUp(role, {
        leadId: id!,
        scheduledAt: tomorrow.toISOString(),
        notes: 'Follow-up scheduled from mobile app',
        priority: 'medium',
      });
    },
    onSuccess: () => {
      Alert.alert('Follow-up created', 'A follow-up has been scheduled for tomorrow 10 AM.');
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    },
    onError: (error) => Alert.alert('Could not schedule', getErrorMessage(error)),
  });

  if (leadQuery.isLoading || !leadQuery.data) return <LoadingView />;

  const lead = leadQuery.data;
  const notes = notesQuery.data || [];

  return (
    <>
      <Stack.Screen options={{ title: lead.name || 'Lead Details' }} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={leadQuery.isRefetching} onRefresh={refreshAll} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.content}
      >
        <View style={[styles.heroCard, shadows.card]}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.leadName}>{lead.name}</Text>
              {lead.leadId ? <Text style={styles.leadId}>#{lead.leadId}</Text> : null}
            </View>
            {lead.isHot ? <HotBadge /> : null}
          </View>
          <StatusBadge status={lead.status} />

          <View style={styles.actionsRow}>
            {lead.phone ? (
              <ActionButton
                icon="call"
                label="Call"
                onPress={() => Linking.openURL(`tel:${lead.phone}`)}
              />
            ) : null}
            {lead.phone ? (
              <ActionButton
                icon="logo-whatsapp"
                label="WhatsApp"
                tint="#25D366"
                onPress={() => Linking.openURL(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`)}
              />
            ) : null}
            <ActionButton
              icon="calendar"
              label="Follow-up"
              onPress={() => followUpMutation.mutate()}
            />
          </View>
        </View>

        <Section title="Details">
          <DetailRow label="Destination" value={lead.destination || '—'} />
          <DetailRow label="Budget" value={lead.budget ? `₹${lead.budget.toLocaleString('en-IN')}` : '—'} />
          <DetailRow label="Email" value={lead.email || '—'} />
          <DetailRow label="Phone" value={lead.phone || '—'} />
          <DetailRow label="Source" value={lead.source || '—'} />
          {lead.createdAt ? (
            <DetailRow
              label="Created"
              value={format(parseISO(lead.createdAt), 'dd MMM yyyy')}
            />
          ) : null}
        </Section>

        <Section title="Status">
          <Pressable
            onPress={() => setShowStatusPicker((v) => !v)}
            style={styles.statusToggle}
          >
            <Text style={styles.statusToggleText}>Update status</Text>
            <Ionicons
              name={showStatusPicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.primary}
            />
          </Pressable>
          {showStatusPicker ? (
            <View style={styles.statusGrid}>
              {STATUS_OPTIONS.map((status) => (
                <Pressable
                  key={status}
                  onPress={() => updateStatusMutation.mutate(status)}
                  style={[
                    styles.statusOption,
                    lead.status === status && styles.statusOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      lead.status === status && styles.statusOptionTextActive,
                    ]}
                  >
                    {LEAD_STATUS_LABELS[status]}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Section>

        <Section title="Notes">
          <View style={styles.noteInputRow}>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add a note..."
              placeholderTextColor={colors.textMuted}
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
                  {note.createdBy?.name || 'You'} ·{' '}
                  {format(parseISO(note.createdAt), 'dd MMM yyyy, h:mm a')}
                </Text>
              </View>
            ))
          ) : (
            <EmptyState title="No notes yet" subtitle="Add the first note above" icon="document-text-outline" />
          )}
        </Section>
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  tint = colors.primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn}>
      <View style={[styles.actionIcon, { backgroundColor: `${tint}14` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  heroTop: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  leadName: { fontSize: 22, fontWeight: '800', color: colors.text },
  leadId: { marginTop: 2, fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { marginTop: 6, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  statusToggleText: { color: colors.primary, fontWeight: '700' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  statusOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusOptionText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  statusOptionTextActive: { color: '#fff' },
  noteInputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  noteInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    color: colors.text,
  },
  noteSend: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  noteContent: { fontSize: 14, color: colors.text, lineHeight: 20 },
  noteMeta: { marginTop: 6, fontSize: 11, color: colors.textMuted, fontWeight: '600' },
});
