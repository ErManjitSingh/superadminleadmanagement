import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingView } from '@/src/components/LoadingView';
import { getLeadStatusColor, getLeadStatusLabel } from '@/src/constants/leadStatus';
import { useAuth } from '@/src/context/AuthContext';
import { fetchLeads } from '@/src/services/leads';
import type { Lead, LeadFilterKey, UserRole } from '@/src/types';

const BG = '#F7F8FC';
const PURPLE = '#7C3AED';

const FILTERS: Array<{
  key: LeadFilterKey;
  label: string;
  color: string;
  bg: string;
}> = [
  { key: 'all', label: 'All', color: PURPLE, bg: '#EDE9FE' },
  { key: 'new', label: 'New', color: '#2563EB', bg: '#DBEAFE' },
  { key: 'contacted', label: 'Contacted', color: '#EA580C', bg: '#FFEDD5' },
  { key: 'follow-up', label: 'Follow-up', color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'hot', label: 'Hot', color: '#E11D48', bg: '#FFE4E6' },
  { key: 'converted', label: 'Converted', color: '#059669', bg: '#D1FAE5' },
  { key: 'lost', label: 'Lost', color: '#475569', bg: '#E2E8F0' },
];

const AVATAR_COLORS = ['#A78BFA', '#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#FB7185'];

function digitsOnly(phone?: string) {
  return String(phone || '').replace(/\D/g, '');
}

function LeadListCard({ lead }: { lead: Lead }) {
  const initial = (lead.name || 'L').charAt(0).toUpperCase();
  const avatarBg = AVATAR_COLORS[(lead.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const statusColor = getLeadStatusColor(lead.status);
  const when = lead.createdAt
    ? formatDistanceToNow(parseISO(lead.createdAt), { addSuffix: true })
    : '';
  const phone = typeof lead.phone === 'string' ? lead.phone : '';
  const wa = digitsOnly(phone);
  const destination =
    typeof lead.destination === 'string' && lead.destination ? lead.destination : 'Custom package';
  const leadId =
    lead.leadId != null && (typeof lead.leadId === 'string' || typeof lead.leadId === 'number')
      ? String(lead.leadId)
      : lead._id?.slice?.(-4);

  const openCall = () => {
    if (!phone) {
      Alert.alert('No phone', 'This lead has no phone number.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const openWhatsApp = () => {
    if (!wa) {
      Alert.alert('No phone', 'This lead has no phone number.');
      return;
    }
    const num = wa.length === 10 ? `91${wa}` : wa;
    Linking.openURL(`https://wa.me/${num}`);
  };

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/lead/${lead._id}`)}>
      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.name} numberOfLines={1}>
              {typeof lead.name === 'string' ? lead.name : 'Lead'}
            </Text>
            <Text style={styles.leadId}>#{leadId}</Text>
          </View>
          <View style={styles.cardTopRight}>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}18` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getLeadStatusLabel(lead.status)}
              </Text>
            </View>
            {when ? <Text style={styles.time}>{when}</Text> : null}
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="briefcase-outline" size={13} color="#94A3B8" />
          <Text style={styles.metaText} numberOfLines={1}>
            {destination}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color="#94A3B8" />
          <Text style={styles.metaText} numberOfLines={1}>
            {destination}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: '#EDE9FE' }]}
            onPress={(e) => {
              e.stopPropagation?.();
              openCall();
            }}
          >
            <Ionicons name="call" size={16} color={PURPLE} />
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: '#DCFCE7' }]}
            onPress={(e) => {
              e.stopPropagation?.();
              openWhatsApp();
            }}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#16A34A" />
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]}
            onPress={(e) => {
              e.stopPropagation?.();
              router.push(`/lead/${lead._id}`);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#64748B" />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </View>
    </Pressable>
  );
}

export default function LeadsScreen() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const params = useLocalSearchParams<{ filter?: string }>();
  const initialFilter = (FILTERS.some((f) => f.key === params.filter)
    ? params.filter
    : 'all') as LeadFilterKey;
  const [filter, setFilter] = useState<LeadFilterKey>(initialFilter);
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState<Partial<Record<LeadFilterKey, number>>>({});

  useEffect(() => {
    if (params.filter && FILTERS.some((f) => f.key === params.filter)) {
      setFilter(params.filter as LeadFilterKey);
    }
  }, [params.filter]);

  const query = useInfiniteQuery({
    queryKey: ['leads', role, filter, search, 'v2'],
    initialPageParam: 1,
    enabled: !!role,
    queryFn: ({ pageParam }) =>
      fetchLeads(role!, {
        page: pageParam,
        limit: 20,
        filter,
        search: search.trim() || undefined,
      }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.items.length >= (lastPage.limit || 20) ? pages.length + 1 : undefined,
  });

  useEffect(() => {
    const totalFromQuery = query.data?.pages?.[0]?.total;
    if (typeof totalFromQuery === 'number') {
      setCounts((prev) => ({ ...prev, [filter]: totalFromQuery }));
    }
  }, [filter, query.data]);

  const leads = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );
  const total = query.data?.pages?.[0]?.total ?? counts[filter] ?? leads.length;

  if (!role) return <LoadingView />;
  if (query.isLoading && !query.data) return <LoadingView />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            Leads
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Manage and track your leads
          </Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() =>
            Alert.alert('Add Lead', 'Lead creation is available on the web CRM for now.')
          }
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, phone, package..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Status chips */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key];
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? (f.key === 'all' ? PURPLE : f.bg) : '#fff',
                    borderColor: active ? f.color : '#E2E8F0',
                  },
                ]}
              >
                {f.key !== 'all' ? (
                  <View style={[styles.chipDot, { backgroundColor: f.color }]} />
                ) : null}
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? (f.key === 'all' ? '#fff' : f.color) : '#64748B' },
                  ]}
                  numberOfLines={1}
                >
                  {f.label}
                  {count != null ? ` (${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* List meta */}
      <View style={styles.listMeta}>
        <Text style={styles.foundText}>{total} leads found</Text>
        <View style={styles.sortChip}>
          <Text style={styles.sortText}>Latest</Text>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </View>
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <LeadListCard lead={item} />}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={PURPLE}
          />
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EmptyState
            title="No leads found"
            subtitle={search ? 'Try a different search term' : 'Leads assigned to you will show here'}
          />
        }
        contentContainerStyle={leads.length ? styles.list : styles.listEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0, paddingRight: 4 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  subtitle: { marginTop: 2, fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 0,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', paddingVertical: 0 },

  chipsWrap: { marginBottom: 4 },
  chipsRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 36,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: '700' },

  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  foundText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 13, fontWeight: '700', color: '#64748B' },

  list: { paddingHorizontal: 16, paddingBottom: 28 },
  listEmpty: { flexGrow: 1 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2FF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTopRight: { alignItems: 'flex-end', gap: 4 },
  name: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  leadId: { marginTop: 2, fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  time: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: { flex: 1, fontSize: 13, color: '#64748B', fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
