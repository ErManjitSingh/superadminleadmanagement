import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingView } from '@/src/components/LoadingView';
import { colors, shadows } from '@/src/constants/theme';
import { fetchOpsVouchers, type OpsVoucher } from '@/src/services/operations';

const TYPES = [
  { id: 'all', label: 'All' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'cab', label: 'Cab' },
  { id: 'client', label: 'Client' },
  { id: 'activity', label: 'Activity' },
];

const TYPE_LOOK: Record<string, { bg: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  hotel: { bg: '#F5F3FF', color: '#7C3AED', icon: 'bed' },
  transport: { bg: '#EFF6FF', color: '#2563EB', icon: 'car' },
  cab: { bg: '#EFF6FF', color: '#2563EB', icon: 'car' },
  client: { bg: '#ECFDF5', color: '#059669', icon: 'book' },
  master: { bg: '#ECFDF5', color: '#059669', icon: 'book' },
  activity: { bg: '#FFF7ED', color: '#EA580C', icon: 'compass' },
  flight: { bg: '#ECFEFF', color: '#0891B2', icon: 'airplane' },
};

export default function OpsVouchersScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const type = typeof params.type === 'string' && params.type ? params.type : 'all';
  const query = useQuery({
    queryKey: ['ops-vouchers', type],
    queryFn: () => fetchOpsVouchers(type),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Vouchers</Text>
          <Text style={styles.subtitle}>{query.data?.length ?? 0} issued</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {TYPES.map((t) => {
          const active = type === t.id;
          return (
            <Pressable key={t.id} onPress={() => router.setParams({ type: t.id })} style={[styles.chip, active && styles.chipOn]}>
              <Text style={[styles.chipText, active && styles.chipTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {query.isLoading ? (
        <LoadingView />
      ) : query.isError ? (
        <Pressable onPress={() => query.refetch()}>
          <EmptyState icon="cloud-offline-outline" title="Could not load vouchers" subtitle="Tap to retry." />
        </Pressable>
      ) : (
        <FlatList
          data={query.data || []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor="#7C3AED" />}
          ListEmptyComponent={<EmptyState icon="ticket-outline" title="No vouchers" subtitle="Generated vouchers will show here." />}
          renderItem={({ item }) => <VoucherCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function VoucherCard({ item }: { item: OpsVoucher }) {
  const booking = item.booking && typeof item.booking === 'object' ? item.booking : null;
  const look = TYPE_LOOK[item.type || ''] || { bg: '#F5F3FF', color: '#7C3AED', icon: 'ticket' as const };
  return (
    <Pressable
      style={[styles.card, shadows.card]}
      onPress={() => {
        if (booking?._id) {
          router.push(`/operations/booking/${booking._id}` as never);
          return;
        }
        router.push({
          pathname: '/crm-web',
          params: { path: '/operations-manager/vouchers', title: item.voucherNumber || 'Voucher' },
        });
      }}
    >
      <View style={[styles.icon, { backgroundColor: look.bg }]}>
        <Ionicons name={look.icon} size={18} color={look.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.number}>{item.voucherNumber || 'Voucher'}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {String(item.type || 'voucher').replace(/_/g, ' ')}
          {booking?.customerName ? ` · ${booking.customerName}` : ''}
        </Text>
        {booking?.destination ? <Text style={styles.dest} numberOfLines={1}>{booking.destination}</Text> : null}
      </View>
      <View style={[styles.pill, { backgroundColor: look.bg }]}>
        <Text style={[styles.pillText, { color: look.color }]}>{item.status || 'ready'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F2FB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  filters: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff' },
  chipOn: { backgroundColor: '#DB2777' },
  chipText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  chipTextOn: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  number: { fontWeight: '800', color: '#0F172A' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize', fontWeight: '600' },
  dest: { color: '#334155', fontSize: 12, marginTop: 2, fontWeight: '600' },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
});
