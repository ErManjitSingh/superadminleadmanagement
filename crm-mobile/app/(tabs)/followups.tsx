import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/src/components/EmptyState';
import { FilterChips } from '@/src/components/KpiCard';
import { FollowUpCard } from '@/src/components/FollowUpCard';
import { DateTimeField } from '@/src/components/DateTimeField';
import { LeadPicker } from '@/src/components/LeadPicker';
import { LoadingView } from '@/src/components/LoadingView';
import { colors, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { getErrorMessage } from '@/src/lib/apiClient';
import { createFollowUp, fetchFollowUps, updateFollowUp } from '@/src/services/followups';
import type { FollowUp, Lead, UserRole } from '@/src/types';

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Done' },
] as const;

type FollowUpTab = (typeof TABS)[number]['key'];
const PURPLE = '#7C3AED';

function getLeadId(item: FollowUp): string | null {
  if (typeof item.lead === 'object' && item.lead && '_id' in item.lead) {
    return item.lead._id || null;
  }
  return null;
}

export default function FollowUpsScreen() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FollowUpTab>('today');
  const [showCreate, setShowCreate] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [leadName, setLeadName] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  });

  const query = useInfiniteQuery({
    queryKey: ['followups', role, tab],
    initialPageParam: 1,
    enabled: !!role,
    queryFn: ({ pageParam }) => fetchFollowUps(role!, { page: pageParam, limit: 25, tab }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.items.length >= (lastPage.limit || 25) ? pages.length + 1 : undefined,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => updateFollowUp(role!, id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => Alert.alert('Error', String(error)),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createFollowUp(role!, {
        leadId,
        scheduledAt: scheduledAt.toISOString(),
        notes: notes.trim() || undefined,
        priority,
      }),
    onSuccess: () => {
      setShowCreate(false);
      setLeadId('');
      setLeadName('');
      setNotes('');
      setPriority('medium');
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Scheduled', 'Follow-up created successfully');
    },
    onError: (error) => Alert.alert('Could not create', getErrorMessage(error)),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  const openCreate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    setScheduledAt(d);
    setShowCreate(true);
  };

  const onSelectLead = (lead: Lead) => {
    setLeadId(lead._id);
    setLeadName(lead.name || 'Lead');
  };

  if (!role) return <LoadingView />;
  if (query.isLoading && !query.data) return <LoadingView />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Follow-ups</Text>
        <Pressable style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addText}>Schedule</Text>
        </Pressable>
      </View>

      <FilterChips options={[...TABS]} value={tab} onChange={setTab} />

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const lid = getLeadId(item);
          return (
            <FollowUpCard
              item={item}
              onPress={lid ? () => router.push(`/lead/${lid}`) : undefined}
              onComplete={
                item.status !== 'completed'
                  ? () => {
                      Alert.alert('Mark complete?', 'This follow-up will be marked as done.', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Complete',
                          onPress: () => completeMutation.mutate(item._id),
                        },
                      ]);
                    }
                  : undefined
              }
            />
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EmptyState
            title="No follow-ups"
            subtitle="Follow-ups for this tab will appear here"
            icon="calendar-outline"
          />
        }
        contentContainerStyle={items.length ? styles.list : styles.listEmpty}
      />

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Schedule follow-up</Text>
            <Text style={styles.label}>Lead *</Text>
            <Pressable style={styles.picker} onPress={() => setPickerOpen(true)}>
              <Text style={{ color: leadName ? '#0F172A' : '#94A3B8', fontWeight: '700' }}>
                {leadName || 'Search & select lead'}
              </Text>
            </Pressable>
            <DateTimeField
              label="Date & time"
              mode="datetime"
              value={scheduledAt}
              onChange={setScheduledAt}
              minimumDate={new Date()}
            />
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[styles.priorityChip, priority === p && styles.priorityActive]}
                >
                  <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Reminder note…"
              placeholderTextColor="#94A3B8"
              style={[styles.input, { minHeight: 70 }]}
              multiline
            />
            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.saveBtn}
                disabled={createMutation.isPending}
                onPress={() => {
                  if (!leadId) return Alert.alert('Required', 'Select a lead first');
                  createMutation.mutate();
                }}
              >
                <Text style={styles.saveText}>
                  {createMutation.isPending ? 'Saving…' : 'Schedule'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <LeadPicker
        visible={pickerOpen}
        role={role}
        onClose={() => setPickerOpen(false)}
        onSelect={onSelectLead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { paddingBottom: spacing.xxl },
  listEmpty: { flexGrow: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  label: { marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: '700', color: '#64748B' },
  picker: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priorityActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  priorityText: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'capitalize' },
  priorityTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
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
