import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
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
import { EmptyState } from '@/src/components/EmptyState';
import { LeadPicker } from '@/src/components/LeadPicker';
import { LoadingView } from '@/src/components/LoadingView';
import { useAuth } from '@/src/context/AuthContext';
import { getErrorMessage } from '@/src/lib/apiClient';
import {
  createLeadQuotation,
  getQuotationPackageName,
  getQuotationTotal,
  listMyQuotations,
  type Quotation,
} from '@/src/services/quotations';
import type { UserRole } from '@/src/types';

const PURPLE = '#7C3AED';
const BG = '#F7F8FC';

export default function QuotesScreen() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const queryClient = useQueryClient();
  const [showQuick, setShowQuick] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [leadName, setLeadName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [amount, setAmount] = useState('');
  const [asDraft, setAsDraft] = useState(false);

  const query = useInfiniteQuery({
    queryKey: ['quotations', role],
    queryFn: ({ pageParam = 1 }) => listMyQuotations(role!, { page: pageParam, limit: 20 }),
    enabled: !!role,
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createLeadQuotation(role!, {
        leadId: leadId.trim(),
        packageName: packageName.trim(),
        amount: Number(amount),
        asDraft,
      }),
    onSuccess: (created) => {
      setShowQuick(false);
      setLeadId('');
      setLeadName('');
      setPackageName('');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      Alert.alert('Quotation created', created?.quoteNumber || 'Saved successfully', [
        {
          text: 'View PDF',
          onPress: () => router.push(`/quotation/${created._id || created.id}`),
        },
        { text: 'OK' },
      ]);
    },
    onError: (error) => Alert.alert('Could not create quotation', getErrorMessage(error)),
  });

  if (!role) return <LoadingView />;
  if (query.isLoading) return <LoadingView />;

  const items = query.data?.pages.flatMap((p) => p.items) || [];

  const openFullBuilder = () => {
    router.push('/quotation/create');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Quotations</Text>
          <Text style={styles.sub}>{items.length} quotes</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowQuick(true)} style={styles.secondaryBtn}>
            <Ionicons name="flash" size={16} color={PURPLE} />
            <Text style={styles.secondaryText}>Quick</Text>
          </Pressable>
          <Pressable onPress={openFullBuilder} style={styles.primaryBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.primaryText}>Create Quote</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={PURPLE} />
        }
        onEndReached={() => query.hasNextPage && query.fetchNextPage()}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No quotations yet"
            subtitle="Use Full Builder for complete CRM quotation, or Quick create."
          />
        }
        renderItem={({ item }) => <QuoteCard item={item} />}
      />

      <Modal visible={showQuick} transparent animationType="slide" onRequestClose={() => setShowQuick(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Quick Quotation</Text>
            <Text style={styles.hint}>Pick a lead, set package + amount. For full hotels/itinerary use Create Quote.</Text>
            <Text style={styles.label}>Lead *</Text>
            <Pressable style={styles.input} onPress={() => setPickerOpen(true)}>
              <Text style={{ color: leadName || leadId ? '#0F172A' : '#94A3B8', fontWeight: '600' }}>
                {leadName || (leadId ? `Lead · ${leadId.slice(-6)}` : 'Search & select lead')}
              </Text>
            </Pressable>
            <Text style={styles.label}>Package name</Text>
            <TextInput
              value={packageName}
              onChangeText={setPackageName}
              placeholder="Shimla Manali 5N/6D"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="25000"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
            <Pressable onPress={() => setAsDraft((v) => !v)} style={styles.draftRow}>
              <Ionicons name={asDraft ? 'checkbox' : 'square-outline'} size={20} color={PURPLE} />
              <Text style={styles.draftText}>Save as draft</Text>
            </Pressable>
            <View style={styles.actions}>
              <Pressable onPress={() => setShowQuick(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!leadId.trim() || !Number(amount)) {
                    Alert.alert('Required', 'Select a lead and enter amount.');
                    return;
                  }
                  createMutation.mutate();
                }}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>{createMutation.isPending ? 'Saving…' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {role ? (
        <LeadPicker
          visible={pickerOpen}
          role={role}
          onClose={() => setPickerOpen(false)}
          onSelect={(lead) => {
            setLeadId(lead._id);
            setLeadName(lead.name || 'Lead');
            if (lead.destination && !packageName) setPackageName(lead.destination);
            if (lead.budget && !amount) setAmount(String(lead.budget));
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function QuoteCard({ item }: { item: Quotation }) {
  const total = getQuotationTotal(item);
  const status = (item.status || 'draft').replace(/_/g, ' ');
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/quotation/${item._id}`)}>
      <View style={styles.cardTop}>
        <Text style={styles.quoteNo}>{item.quoteNumber || 'Draft'}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
      <Text style={styles.pkg} numberOfLines={1}>
        {getQuotationPackageName(item)}
      </Text>
      <View style={styles.cardBottom}>
        <Text style={styles.amount}>{total > 0 ? `₹${total.toLocaleString('en-IN')}` : '—'}</Text>
        <Text style={styles.date}>
          {item.createdAt ? format(parseISO(item.createdAt), 'dd MMM yyyy') : ''}
        </Text>
      </View>
      <View style={styles.viewRow}>
        <Ionicons name="document-outline" size={14} color={PURPLE} />
        <Text style={styles.viewText}>View PDF</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  sub: { marginTop: 2, fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 8 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryText: { color: PURPLE, fontWeight: '700', fontSize: 13 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteNo: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  statusPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontSize: 11, fontWeight: '700', color: '#4F46E5', textTransform: 'capitalize' },
  pkg: { marginTop: 6, fontSize: 14, color: '#475569', fontWeight: '600' },
  cardBottom: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: { fontSize: 16, fontWeight: '800', color: PURPLE },
  date: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  viewRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewText: { color: PURPLE, fontWeight: '700', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  hint: { marginTop: 6, marginBottom: 10, fontSize: 12, color: '#64748B', lineHeight: 18 },
  label: { marginTop: 10, marginBottom: 6, fontSize: 12, fontWeight: '700', color: '#64748B' },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  draftText: { fontWeight: '600', color: '#334155' },
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
