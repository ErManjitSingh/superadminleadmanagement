import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingView } from '@/src/components/LoadingView';
import { colors, shadows } from '@/src/constants/theme';
import { fetchOpsBookings, type OpsBooking } from '@/src/services/operations';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; bar: string }> = {
  pending: { bg: '#FFF7ED', text: '#C2410C', bar: '#F97316' },
  booking_received: { bg: '#FFF7ED', text: '#C2410C', bar: '#F97316' },
  pending_verification: { bg: '#FFF7ED', text: '#C2410C', bar: '#F97316' },
  confirmed: { bg: '#ECFDF5', text: '#047857', bar: '#10B981' },
  in_progress: { bg: '#F5F3FF', text: '#6D28D9', bar: '#7C3AED' },
  completed: { bg: '#F1F5F9', text: '#334155', bar: '#64748B' },
  cancelled: { bg: '#FFF1F2', text: '#BE123C', bar: '#F43F5E' },
};

function money(n?: number) {
  if (!n) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function when(value?: string) {
  if (!value) return '';
  try {
    return format(parseISO(value), 'dd MMM');
  } catch {
    return '';
  }
}

function statusLook(status?: string) {
  return STATUS_STYLE[status || ''] || { bg: '#F5F3FF', text: '#6D28D9', bar: '#7C3AED' };
}

export default function OpsBookingsScreen() {
  const params = useLocalSearchParams<{ status?: string }>();
  const [status, setStatus] = useState(typeof params.status === 'string' ? params.status : '');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    if (typeof params.status === 'string') setStatus(params.status);
  }, [params.status]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: ['ops-bookings', status, debounced],
    queryFn: ({ pageParam = 1 }) =>
      fetchOpsBookings({ page: pageParam, limit: 20, status: status || undefined, search: debounced || undefined }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });

  const items = query.data?.pages.flatMap((p) => p.items) || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Bookings</Text>
          <Text style={styles.subtitle}>{query.data?.pages[0]?.total ?? items.length} trips</Text>
        </View>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#94A3B8" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Guest, booking no, destination"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => {
          const active = status === f.id;
          return (
            <Pressable key={f.id || 'all'} onPress={() => setStatus(f.id)} style={[styles.chip, active && styles.chipOn]}>
              <Text style={[styles.chipText, active && styles.chipTextOn]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {query.isLoading ? (
        <LoadingView />
      ) : query.isError ? (
        <Pressable onPress={() => query.refetch()}>
          <EmptyState icon="cloud-offline-outline" title="Could not load bookings" subtitle="Tap to retry." />
        </Pressable>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor="#7C3AED" />}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          ListEmptyComponent={<EmptyState icon="airplane-outline" title="No bookings" subtitle="Try another filter or search." />}
          renderItem={({ item }) => <BookingCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function BookingCard({ item }: { item: OpsBooking }) {
  const look = statusLook(item.status);
  const initial = (item.customerName || 'G').charAt(0).toUpperCase();
  return (
    <Pressable style={[styles.card, shadows.card, { borderLeftColor: look.bar }]} onPress={() => router.push(`/operations/booking/${item._id}` as never)}>
      <View style={[styles.avatar, { backgroundColor: look.bg }]}>
        <Text style={[styles.avatarText, { color: look.text }]}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.cardTop}>
          <Text style={styles.name} numberOfLines={1}>{item.customerName || 'Guest'}</Text>
          <Text style={styles.amount}>{money(item.totalAmount)}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {item.bookingNumber || 'Booking'} · {item.destination || item.packageName || 'Trip'}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={styles.date}>{when(item.travelDate)}{item.returnDate ? ` – ${when(item.returnDate)}` : ''}</Text>
          <View style={[styles.pill, { backgroundColor: look.bg }]}>
            <Text style={[styles.pillText, { color: look.text }]}>{String(item.status || 'pending').replace(/_/g, ' ')}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F2FB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  searchWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  search: { flex: 1, color: '#0F172A', fontWeight: '600' },
  filters: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff' },
  chipOn: { backgroundColor: '#6D28D9' },
  chipText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  chipTextOn: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    borderLeftWidth: 4,
  },
  avatar: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontWeight: '800', fontSize: 15, color: '#0F172A' },
  amount: { fontWeight: '800', color: '#6D28D9', fontSize: 13 },
  meta: { marginTop: 3, color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  cardBottom: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: '#334155', fontSize: 12, fontWeight: '700' },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
});
