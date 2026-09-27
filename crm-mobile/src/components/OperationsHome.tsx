import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OPS_SECTIONS, type OpsLink } from '@/src/constants/operationsMenu';
import { colors, shadows } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { fetchOpsDashboard, type OpsAlert, type OpsBooking } from '@/src/services/operations';

const PURPLE = '#6D28D9';

const SECTION_TINT: Record<string, { bg: string; icon: string }> = {
  Bookings: { bg: '#EEF2FF', icon: '#4F46E5' },
  'Trip execution': { bg: '#ECFDF5', icon: '#059669' },
  Vouchers: { bg: '#FDF2F8', icon: '#DB2777' },
  Vendors: { bg: '#EFF6FF', icon: '#2563EB' },
  Operations: { bg: '#FFF7ED', icon: '#EA580C' },
  Insights: { bg: '#F5F3FF', icon: '#7C3AED' },
};

export function openOpsLink(item: OpsLink) {
  if (item.native) {
    const [pathname, qs] = item.native.split('?');
    if (qs) {
      const params = Object.fromEntries(new URLSearchParams(qs).entries());
      router.push({ pathname: pathname as never, params });
    } else {
      router.push(pathname as never);
    }
    return;
  }
  if (item.webPath) {
    router.push({ pathname: '/crm-web', params: { path: item.webPath, title: item.label } });
  }
}

function openAlert(alert: OpsAlert) {
  const href = alert.href || '';
  if (href.includes('/bookings/')) {
    const status = href.split('/').pop() || 'pending';
    router.push({ pathname: '/operations/bookings' as never, params: { status } });
    return;
  }
  if (href.includes('/vouchers')) {
    router.push('/operations/vouchers' as never);
    return;
  }
  if (href) {
    router.push({ pathname: '/crm-web', params: { path: href, title: alert.title || 'Operations' } });
  }
}

function formatWhen(value?: string) {
  if (!value) return '';
  try {
    return format(parseISO(value), 'dd MMM');
  } catch {
    return '';
  }
}

function moneyShort(n?: number) {
  const v = Number(n) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${Math.round(v / 1000)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

export function OperationsHome() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['ops-dashboard'], queryFn: fetchOpsDashboard });
  const kpis = query.data?.kpis || {};
  const bookings = query.data?.newBookings?.length ? query.data.newBookings : query.data?.recentBookings || [];
  const alerts = (query.data?.alerts || []).filter((a) => a?.title);
  const schedule = query.data?.scheduleEvents || [];
  const first = user?.name?.split(' ')[0] || 'there';

  const kpisRow = [
    { label: 'Total', value: String(kpis.totalBookings ?? 0), icon: 'clipboard' as const, bg: '#EFF6FF', color: '#2563EB', go: '/operations/bookings' },
    { label: 'Confirmed', value: String(kpis.confirmedBookings ?? 0), icon: 'checkmark-circle' as const, bg: '#ECFDF5', color: '#059669', go: '/operations/bookings?status=confirmed' },
    { label: 'Pending', value: String(kpis.pendingBookings ?? 0), icon: 'time' as const, bg: '#FFF7ED', color: '#EA580C', go: '/operations/bookings?status=pending' },
    { label: 'On trip', value: String(kpis.activeTrips ?? 0), icon: 'airplane' as const, bg: '#F5F3FF', color: '#7C3AED', go: '/operations/bookings?status=active' },
    { label: 'Revenue', value: moneyShort(kpis.totalRevenue), icon: 'cash' as const, bg: '#ECFEFF', color: '#0891B2', go: '/operations/bookings' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor="#fff" />}
      >
        <LinearGradient colors={['#312E81', '#6D28D9', '#A78BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Operations panel</Text>
              <Text style={styles.heroTitle}>Hi, {first}</Text>
              <Text style={styles.heroSub}>Today’s trips, confirmations and vouchers</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.profileBtn}>
              <Text style={styles.profileLetter}>{(user?.name || 'O').charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
          <View style={styles.todayRow}>
            <TodayPill icon="log-in" label="Arrivals" value={kpis.todaysArrivals ?? 0} />
            <TodayPill icon="log-out" label="Departures" value={kpis.todaysDepartures ?? 0} />
            <TodayPill icon="people" label="On trip" value={kpis.guestsOnTrip ?? 0} />
          </View>
        </LinearGradient>

        {query.isError ? (
          <Pressable style={styles.errorBox} onPress={() => query.refetch()}>
            <Ionicons name="refresh" size={16} color="#BE123C" />
            <Text style={styles.errorText}>Dashboard load nahi hua. Tap to retry.</Text>
          </Pressable>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
          {kpisRow.map((card) => (
            <Pressable
              key={card.label}
              style={[styles.kpi, shadows.card]}
              onPress={() => {
                if (card.go.includes('?')) {
                  const [path, qs] = card.go.split('?');
                  router.push({ pathname: path as never, params: Object.fromEntries(new URLSearchParams(qs)) });
                } else {
                  router.push(card.go as never);
                }
              }}
            >
              <View style={[styles.kpiIcon, { backgroundColor: card.bg }]}>
                <Ionicons name={card.icon} size={18} color={card.color} />
              </View>
              <Text style={styles.kpiValue}>{query.isLoading ? '—' : card.value}</Text>
              <Text style={styles.kpiLabel}>{card.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {alerts.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Needs attention</Text>
            {alerts.map((alert) => {
              const tone =
                alert.tone === 'amber' ? '#F59E0B' : alert.tone === 'emerald' ? '#10B981' : alert.tone === 'sky' ? '#0EA5E9' : '#F43F5E';
              return (
              <Pressable key={alert.id || alert.title} style={[styles.alert, { borderLeftColor: tone }]} onPress={() => openAlert(alert)}>
                <View style={[styles.alertDot, { backgroundColor: tone }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  {alert.timeAgo ? <Text style={styles.alertTime}>{alert.timeAgo}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>New bookings</Text>
            <Pressable onPress={() => router.push('/operations/bookings' as never)}>
              <Text style={styles.link}>See all</Text>
            </Pressable>
          </View>
          {!bookings.length && !query.isLoading ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-done" size={18} color="#059669" />
              <Text style={styles.emptyText}>No new bookings waiting.</Text>
            </View>
          ) : (
            bookings.slice(0, 5).map((b) => <BookingRow key={b._id} booking={b} />)
          )}
        </View>

        {schedule.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today’s schedule</Text>
            {schedule.slice(0, 4).map((event) => (
              <View key={event.id || event.title} style={styles.schedule}>
                <Text style={styles.scheduleTime}>{event.time}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleTitle}>{event.title}</Text>
                  {event.subtitle ? <Text style={styles.scheduleSub}>{event.subtitle}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {OPS_SECTIONS.map((section) => {
          const tint = SECTION_TINT[section.title] || { bg: '#F5F3FF', icon: PURPLE };
          return (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.grid}>
                {section.items.map((item) => (
                  <Pressable key={item.id} style={[styles.tile, shadows.card]} onPress={() => openOpsLink(item)}>
                    <View style={[styles.tileIcon, { backgroundColor: tint.bg }]}>
                      <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={tint.icon} />
                    </View>
                    <Text style={styles.tileLabel}>{item.label}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#CBD5E1" />
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function TodayPill({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={14} color="#fff" />
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function BookingRow({ booking }: { booking: OpsBooking }) {
  const initial = (booking.customerName || 'G').charAt(0).toUpperCase();
  return (
    <Pressable style={[styles.row, shadows.card]} onPress={() => router.push(`/operations/booking/${booking._id}` as never)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{booking.customerName || 'Guest'}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {booking.destination || booking.packageName || booking.bookingNumber || 'Booking'}
        </Text>
      </View>
      <Text style={styles.rowDate}>{formatWhen(booking.travelDate)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F2FB' },
  scroll: { paddingBottom: 36 },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eyebrow: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.82)', marginTop: 4, fontSize: 13, fontWeight: '600' },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLetter: { color: '#fff', fontWeight: '800', fontSize: 18 },
  todayRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  pill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  pillValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  pillLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },
  errorBox: {
    margin: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: '#BE123C', fontWeight: '700', flex: 1 },
  kpiRow: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  kpi: { width: 118, backgroundColor: '#fff', borderRadius: 18, padding: 14 },
  kpiIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  kpiLabel: { marginTop: 2, fontSize: 12, fontWeight: '700', color: colors.textMuted },
  section: { marginTop: 22, paddingHorizontal: 16 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  link: { color: PURPLE, fontWeight: '800', fontSize: 13, marginBottom: 10 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F43F5E',
  },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F43F5E' },
  alertTitle: { fontWeight: '700', color: '#0F172A', fontSize: 13 },
  alertTime: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { color: '#334155', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: PURPLE, fontWeight: '800' },
  rowTitle: { fontWeight: '800', color: '#0F172A', fontSize: 14 },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rowDate: { color: PURPLE, fontWeight: '800', fontSize: 12 },
  schedule: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  scheduleTime: { width: 72, color: PURPLE, fontWeight: '800', fontSize: 12 },
  scheduleTitle: { fontWeight: '800', color: '#0F172A' },
  scheduleSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  grid: { gap: 8 },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tileIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { flex: 1, fontWeight: '800', color: '#0F172A', fontSize: 14 },
});
