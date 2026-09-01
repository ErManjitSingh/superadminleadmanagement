import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { FollowUpCard } from '@/src/components/FollowUpCard';
import { KpiCard } from '@/src/components/KpiCard';
import { LeadCard } from '@/src/components/LeadCard';
import { LoadingView } from '@/src/components/LoadingView';
import { useAuth } from '@/src/context/AuthContext';
import { colors, radius, spacing } from '@/src/constants/theme';
import { fetchDashboard } from '@/src/services/leads';
import { fetchUnreadCount } from '@/src/services/notifications';
import type { UserRole } from '@/src/types';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const role = user!.role as UserRole;
  const firstName = user?.name?.split(' ')[0] || 'there';

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard', role],
    queryFn: () => fetchDashboard(role),
    enabled: !!user,
  });

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: fetchUnreadCount,
    enabled: !!user,
    refetchInterval: 60_000,
  });

  if (isLoading && !data) return <LoadingView />;

  const kpis = data?.kpis || {};
  const progress = data?.target?.progress ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName} 👋
            </Text>
            <Text style={styles.subGreeting}>Here&apos;s your pipeline snapshot today</Text>
          </View>
          <Link href="/notifications" asChild>
            <Pressable style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              {(unreadQuery.data ?? 0) > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {(unreadQuery.data ?? 0) > 9 ? '9+' : unreadQuery.data}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </Link>
        </View>

        <LinearGradient colors={['#EDE9FE', '#EEF2FF']} style={styles.banner}>
          <Text style={styles.bannerLabel}>YOUR PIPELINE</Text>
          <Text style={styles.bannerTitle}>
            {kpis.todayFollowups ?? 0} follow-ups today · {kpis.hotLeads ?? 0} hot leads
          </Text>
          <Text style={styles.bannerSub}>
            Monthly target progress: {Math.round(progress)}%
          </Text>
        </LinearGradient>

        <View style={styles.kpiGrid}>
          <KpiCard label="My Leads" value={kpis.myLeads ?? kpis.totalTeamLeads ?? 0} icon="people" />
          <KpiCard
            label="Hot Leads"
            value={kpis.hotLeads ?? 0}
            icon="flame"
            tint={colors.hot}
          />
          <KpiCard
            label="Converted"
            value={kpis.convertedLeads ?? 0}
            icon="checkmark-circle"
            tint={colors.success}
          />
          <KpiCard
            label="Follow-ups"
            value={kpis.todayFollowups ?? kpis.pendingFollowups ?? 0}
            icon="calendar"
            tint={colors.info}
          />
        </View>

        <SectionHeader title="Today's Tasks" href="/(tabs)/followups" />
        {(data?.todayTasks?.length || data?.upcomingFollowups?.length) ? (
          (data.todayTasks || []).slice(0, 3).map((task) => (
            <FollowUpCard
              key={task._id}
              item={{
                _id: task._id,
                scheduledAt: task.time,
                priority: (task.priority as 'low' | 'medium' | 'high') || 'medium',
                lead: { _id: task._id, name: task.title.replace('Follow up with ', ''), destination: task.destination },
              }}
            />
          ))
        ) : (
          <EmptyState title="No tasks for today" subtitle="You're all caught up!" icon="checkmark-done-outline" />
        )}

        <SectionHeader title="Recent Leads" href="/(tabs)/leads" />
        {data?.recentLeads?.length ? (
          data.recentLeads.slice(0, 5).map((lead) => <LeadCard key={lead._id} lead={lead} />)
        ) : (
          <EmptyState title="No recent leads" subtitle="New leads will appear here" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Link href={href as never} style={styles.sectionLink}>
        View all
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text },
  subGreeting: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  banner: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  bannerTitle: {
    marginTop: spacing.sm,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 24,
  },
  bannerSub: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionLink: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
