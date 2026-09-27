import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingView } from '@/src/components/LoadingView';
import { colors } from '@/src/constants/theme';
import { fetchOpsBooking } from '@/src/services/operations';

function when(value?: string) {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

function money(n?: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function pretty(value?: string) {
  if (!value) return '—';
  return value.replace(/_/g, ' ');
}

export default function OpsBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['ops-booking', id],
    queryFn: () => fetchOpsBooking(String(id)),
    enabled: !!id,
  });
  const booking = query.data;

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingView />
      </SafeAreaView>
    );
  }

  if (query.isError || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Booking</Text>
        </View>
        <Pressable style={styles.error} onPress={() => query.refetch()}>
          <Ionicons name="refresh" size={18} color="#BE123C" />
          <Text style={styles.errorText}>Booking load nahi hui. Tap to retry.</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const hotels = (booking.hotels || []).filter((h) => h.hotelName || h.name);
  const cabs = booking.transport || [];
  const tasks = booking.tasks || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{booking.bookingNumber || 'Booking'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#312E81', '#6D28D9']} style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pretty(booking.status)}</Text>
          </View>
          <Text style={styles.name}>{booking.customerName || 'Guest'}</Text>
          <Text style={styles.dest}>{booking.destination || booking.packageName || 'Trip'}</Text>
          <View style={styles.heroMeta}>
            <Meta icon="calendar" text={`${when(booking.travelDate)} – ${when(booking.returnDate)}`} />
            <Meta icon="people" text={`${booking.adults || 0} adults · ${booking.children || 0} children`} />
            {booking.customerPhone ? <Meta icon="call" text={booking.customerPhone} /> : null}
          </View>
        </LinearGradient>

        <View style={styles.payRow}>
          <PayTile label="Package" value={money(booking.totalAmount)} />
          <PayTile label="Advance" value={money(booking.advanceReceived)} />
          <PayTile label="Balance" value={money(booking.remainingBalance)} accent />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="bed" size={16} color="#7C3AED" />
            <Text style={styles.cardTitle}>Hotels</Text>
          </View>
          <Text style={styles.note}>Confirmation: {pretty(booking.hotelConfirmation)}</Text>
          {hotels.length ? hotels.map((h, i) => (
            <Text key={`${h.hotelName}-${i}`} style={styles.line}>
              {h.hotelName || h.name}{h.roomType ? ` · ${h.roomType}` : ''}
            </Text>
          )) : <Text style={styles.muted}>No named hotel on this booking.</Text>}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="car" size={16} color="#2563EB" />
            <Text style={styles.cardTitle}>Cabs</Text>
          </View>
          <Text style={styles.note}>Confirmation: {pretty(booking.cabConfirmation)}</Text>
          {cabs.length ? cabs.map((t, i) => (
            <Text key={`${t.vehicleType}-${i}`} style={styles.line}>
              {pretty(t.vehicleType || 'Cab')}
              {t.driverName ? ` · ${t.driverName}` : ''}
              {t.pickupLocation ? ` · ${t.pickupLocation}` : ''}
            </Text>
          )) : <Text style={styles.muted}>No cab assigned yet.</Text>}
        </View>

        {tasks.length ? (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="list" size={16} color="#EA580C" />
              <Text style={styles.cardTitle}>Tasks</Text>
            </View>
            {tasks.slice(0, 5).map((task) => (
              <View key={task._id || task.title} style={styles.task}>
                <Ionicons
                  name={task.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={task.status === 'completed' ? '#059669' : '#7C3AED'}
                />
                <Text style={styles.line}>{task.title || 'Task'}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          style={styles.primary}
          onPress={() =>
            router.push({
              pathname: '/crm-web',
              params: {
                path: `/operations-manager/booking/${booking._id}`,
                title: booking.bookingNumber || 'Booking',
              },
            })
          }
        >
          <Ionicons name="open-outline" size={18} color="#fff" />
          <Text style={styles.primaryText}>Open full booking & vouchers</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={14} color="#C4B5FD" />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function PayTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.pay, accent && styles.payAccent]}>
      <Text style={[styles.payLabel, accent && { color: '#6D28D9' }]}>{label}</Text>
      <Text style={[styles.payValue, accent && { color: '#6D28D9' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F2FB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  body: { padding: 16, paddingBottom: 40, gap: 12 },
  hero: { borderRadius: 24, padding: 18 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11, textTransform: 'capitalize' },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 12 },
  dest: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '600' },
  heroMeta: { marginTop: 14, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: 'rgba(255,255,255,0.88)', fontWeight: '600', fontSize: 13 },
  payRow: { flexDirection: 'row', gap: 8 },
  pay: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12 },
  payAccent: { backgroundColor: '#F5F3FF' },
  payLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  payValue: { marginTop: 4, color: '#0F172A', fontWeight: '800', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontWeight: '800', fontSize: 15, color: '#0F172A' },
  note: { color: '#64748B', fontSize: 12, marginBottom: 6, textTransform: 'capitalize', fontWeight: '600' },
  line: { color: '#0F172A', fontWeight: '700', marginBottom: 6, flex: 1 },
  muted: { color: colors.textMuted, fontWeight: '600' },
  task: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primary: {
    marginTop: 4,
    backgroundColor: '#6D28D9',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  error: { margin: 16, padding: 16, borderRadius: 16, backgroundColor: '#FFF1F2', flexDirection: 'row', gap: 8, alignItems: 'center' },
  errorText: { color: '#BE123C', fontWeight: '700', flex: 1 },
});
