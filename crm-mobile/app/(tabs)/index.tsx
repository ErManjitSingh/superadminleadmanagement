import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingView } from '@/src/components/LoadingView';
import { PipelineBars, SourceList } from '@/src/components/DashboardWidgets';
import { getLeadStatusColor, getLeadStatusLabel } from '@/src/constants/leadStatus';
import { useAuth } from '@/src/context/AuthContext';
import { useBranding } from '@/src/context/BrandingContext';
import { fetchDashboard } from '@/src/services/leads';
import { fetchUnreadCount } from '@/src/services/notifications';
import { useDashboardLocalAlerts } from '@/src/hooks/useDashboardLocalAlerts';
import type { Lead, UserRole } from '@/src/types';

const BG = '#F7F8FC';
const PURPLE = '#7C3AED';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function MetricCard({
  label,
  value,
  icon,
  bg,
  iconBg,
  iconColor,
  subtitle,
  onPress,
}: {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.metricCard, { backgroundColor: bg }]}
    >
      <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {subtitle ? <Text style={styles.metricSub}>{subtitle}</Text> : <View style={{ height: 16 }} />}
    </Pressable>
  );
}

function AttentionCard({
  count,
  label,
  icon,
  bg,
  iconColor,
  onPress,
}: {
  count: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.attentionCard, { backgroundColor: bg }]}>
      <View style={styles.attentionTop}>
        <Text style={[styles.attentionCount, { color: iconColor }]}>{count}</Text>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.attentionBottom}>
        <Text style={[styles.attentionLabel, { color: iconColor }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={14} color={iconColor} />
      </View>
    </Pressable>
  );
}

function RecentLeadRow({ lead }: { lead: Lead }) {
  const initial = (lead.name || 'L').charAt(0).toUpperCase();
  const colors = ['#A78BFA', '#60A5FA', '#34D399', '#F472B6', '#FBBF24'];
  const avatarBg = colors[(lead.name?.charCodeAt(0) || 0) % colors.length];
  const statusColor = getLeadStatusColor(lead.status);
  const when = lead.createdAt
    ? formatDistanceToNow(parseISO(lead.createdAt), { addSuffix: true })
    : '';

  return (
    <Pressable style={styles.leadRow} onPress={() => router.push(`/lead/${lead._id}`)}>
      <View style={[styles.leadAvatar, { backgroundColor: avatarBg }]}>
        <Text style={styles.leadAvatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.leadName} numberOfLines={1}>
          {typeof lead.name === 'string' ? lead.name : 'Lead'}
        </Text>
        <Text style={styles.leadDest} numberOfLines={1}>
          {typeof lead.destination === 'string' && lead.destination
            ? lead.destination
            : 'Custom package'}
        </Text>
      </View>
      <View style={styles.leadRight}>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getLeadStatusLabel(lead.status).replace(' Lead', '')}
          </Text>
        </View>
        <View style={styles.leadMeta}>
          <Text style={styles.leadTime}>{when}</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
        </View>
      </View>
    </Pressable>
  );
}

function TaskRow({
  title,
  time,
  destination,
  onPress,
}: {
  title: string;
  time: string;
  destination?: string;
  onPress: () => void;
}) {
  let when = time;
  try {
    when = format(parseISO(time), 'h:mm a');
  } catch {
    /* keep raw */
  }
  return (
    <Pressable style={styles.taskRow} onPress={onPress}>
      <View style={styles.taskDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.taskMeta} numberOfLines={1}>
          {[when, destination].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const role = user?.role as UserRole | undefined;
  const firstName = user?.name?.split(' ')[0] || 'there';
  const initial = (user?.name || 'U').charAt(0).toUpperCase();
  const primary = branding.primaryColor || PURPLE;

  const dashQuery = useQuery({
    queryKey: ['dashboard', role, 'v4'],
    queryFn: () => fetchDashboard(role!),
    enabled: !!role,
    refetchInterval: 60_000,
  });

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: fetchUnreadCount,
    enabled: !!user,
    refetchInterval: 30_000,
  });

  useDashboardLocalAlerts(dashQuery.data);

  const alertMap: Record<string, number> = {};
  (dashQuery.data?.alerts || []).forEach((a) => {
    alertMap[a.key] = a.count;
  });

  if (!role) return <LoadingView />;
  if (dashQuery.isLoading && !dashQuery.data) return <LoadingView />;

  const data = dashQuery.data;
  const kpis = data?.kpis || {};
  const unread = unreadQuery.data ?? 0;

  const totalLeads = kpis.totalLeads ?? kpis.myLeads ?? 0;
  const noBudget = alertMap.leadsWithoutBudget ?? 0;
  const noFollowup = alertMap.leadsWithoutFollowup ?? 0;
  const unassigned = alertMap.unassignedLeads ?? kpis.unassignedLeads ?? 0;
  const todayTasks = data?.todayTasks || [];
  const upcoming = data?.upcomingFollowups || [];
  const pipeline = data?.pipelineOverview || [];
  const sources = data?.leadSources || [];

  const refreshAll = async () => {
    await Promise.all([dashQuery.refetch(), unreadQuery.refetch()]);
  };

  const focusItems = (todayTasks.length ? todayTasks : upcoming).slice(0, 4);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={dashQuery.isRefetching}
            onRefresh={refreshAll}
            tintColor={PURPLE}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/(tabs)/menu')}>
            <Ionicons name="menu-outline" size={24} color="#0F172A" />
          </Pressable>
          <View style={styles.topCenter}>
            <Text style={styles.topTitle} numberOfLines={1}>
              {branding.appTitle || 'Dashboard'}
            </Text>
            <Text style={styles.topSub}>Your CRM command center</Text>
          </View>
          <View style={styles.topRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/(tabs)/leads')}>
              <Ionicons name="search-outline" size={22} color="#0F172A" />
            </Pressable>
            <Link href="/notifications" asChild>
              <Pressable style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={22} color="#0F172A" />
                {unread > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                ) : null}
              </Pressable>
            </Link>
            <Pressable style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.avatarText}>{initial}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.welcomeRow}>
          <View style={styles.welcomeText}>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName} 👋
            </Text>
            <Text style={styles.welcomeSub}>
              Keep going! Great things happen when you follow up.
            </Text>
          </View>
          <View style={[styles.journeyCard, { backgroundColor: `${primary}18` }]}>
            {branding.logo ? (
              <Image
                source={{ uri: branding.logo }}
                style={styles.journeyLogo}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="airplane" size={36} color={primary} />
            )}
          </View>
        </View>

        <View style={styles.sectionHead}>
          <View style={styles.sectionLeft}>
            <Ionicons name="bar-chart" size={16} color={PURPLE} />
            <Text style={styles.sectionTitle}>Key metrics</Text>
          </View>
          <View style={styles.todayChip}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.todayText}>Live</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            label="Total Leads"
            value={totalLeads}
            icon="people"
            bg="#E8F3FF"
            iconBg="#DBEAFE"
            iconColor="#2563EB"
            subtitle={
              kpis.newLeadsToday != null ? `${kpis.newLeadsToday} new today` : undefined
            }
            onPress={() => router.push('/(tabs)/leads')}
          />
          <MetricCard
            label="Hot Leads"
            value={kpis.hotLeads ?? 0}
            icon="flame"
            bg="#FFF1E8"
            iconBg="#FFEDD5"
            iconColor="#EA580C"
            subtitle="Priority pipeline"
            onPress={() => router.push('/(tabs)/leads')}
          />
          <MetricCard
            label="Converted"
            value={kpis.convertedLeads ?? 0}
            icon="checkmark-circle"
            bg="#E8FBF1"
            iconBg="#DCFCE7"
            iconColor="#059669"
            subtitle={
              kpis.conversionRate != null ? `${kpis.conversionRate}% conversion` : undefined
            }
          />
          <MetricCard
            label="Follow-ups"
            value={kpis.todayFollowups ?? kpis.pendingFollowups ?? 0}
            icon="calendar"
            bg="#F1ECFF"
            iconBg="#EDE9FE"
            iconColor={PURPLE}
            subtitle={
              kpis.overdueFollowups ? `${kpis.overdueFollowups} overdue` : 'Due today'
            }
            onPress={() => router.push('/(tabs)/followups')}
          />
        </View>

        {focusItems.length > 0 ? (
          <>
            <View style={styles.sectionHead}>
              <View style={styles.sectionLeft}>
                <Ionicons name="checkbox" size={16} color={PURPLE} />
                <Text style={styles.sectionTitle}>Today&apos;s focus</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/followups')}>
                <Text style={styles.viewAll}>View all ›</Text>
              </Pressable>
            </View>
            <View style={styles.panelCard}>
              {focusItems.map((task) => {
                const isTask = 'title' in task;
                const title = isTask ? task.title : `Follow up · ${task.customer || 'Lead'}`;
                const time = isTask ? task.time : task.scheduledAt;
                return (
                  <TaskRow
                    key={task._id}
                    title={title}
                    time={time}
                    destination={task.destination}
                    onPress={() =>
                      task.leadId
                        ? router.push(`/lead/${task.leadId}`)
                        : router.push('/(tabs)/followups')
                    }
                  />
                );
              })}
            </View>
          </>
        ) : null}

        <View style={styles.sectionHead}>
          <View style={styles.sectionLeft}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.sectionTitle}>Needs attention</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/leads')}>
            <Text style={styles.viewAll}>View all ›</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.attentionRow}
        >
          <AttentionCard
            count={noBudget}
            label="No budget"
            icon="wallet"
            bg="#FFE8EE"
            iconColor="#E11D48"
            onPress={() => router.push('/(tabs)/leads')}
          />
          <AttentionCard
            count={noFollowup}
            label="No follow-up"
            icon="time"
            bg="#FFF6E0"
            iconColor="#D97706"
            onPress={() => router.push('/(tabs)/followups')}
          />
          <AttentionCard
            count={unassigned}
            label="Unassigned"
            icon="person-add"
            bg="#E8F3FF"
            iconColor="#0284C7"
            onPress={() => router.push('/(tabs)/leads')}
          />
        </ScrollView>

        {pipeline.length > 0 ? (
          <>
            <View style={styles.sectionHead}>
              <View style={styles.sectionLeft}>
                <Ionicons name="git-branch" size={16} color={PURPLE} />
                <Text style={styles.sectionTitle}>Pipeline</Text>
              </View>
            </View>
            <View style={[styles.panelCard, { padding: 14 }]}>
              <PipelineBars stages={pipeline} />
            </View>
          </>
        ) : null}

        {sources.length > 0 ? (
          <>
            <View style={styles.sectionHead}>
              <View style={styles.sectionLeft}>
                <Ionicons name="pie-chart" size={16} color={PURPLE} />
                <Text style={styles.sectionTitle}>Lead sources</Text>
              </View>
            </View>
            <View style={[styles.panelCard, { padding: 14 }]}>
              <SourceList sources={sources} />
            </View>
          </>
        ) : null}

        <View style={styles.sectionHead}>
          <View style={styles.sectionLeft}>
            <Ionicons name="list" size={16} color={PURPLE} />
            <Text style={styles.sectionTitle}>Recent leads</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/leads')}>
            <Text style={styles.viewAll}>View all ›</Text>
          </Pressable>
        </View>

        <View style={styles.leadsCard}>
          {data?.recentLeads?.length ? (
            data.recentLeads.slice(0, 5).map((lead, idx) => (
              <View key={lead._id}>
                <RecentLeadRow lead={lead} />
                {idx < Math.min(4, (data.recentLeads?.length || 1) - 1) ? (
                  <View style={styles.divider} />
                ) : null}
              </View>
            ))
          ) : (
            <EmptyState title="No recent leads" subtitle="New leads will appear here" />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 28 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  topSub: { marginTop: 1, fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 18,
  },
  welcomeText: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  welcomeSub: { marginTop: 6, fontSize: 13, lineHeight: 18, color: '#64748B', fontWeight: '500' },
  journeyCard: {
    width: 92,
    height: 92,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyLogo: { width: 64, height: 64 },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  viewAll: { color: PURPLE, fontWeight: '700', fontSize: 13 },
  todayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  todayText: { fontSize: 12, fontWeight: '700', color: '#64748B' },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  metricCard: {
    width: '48%',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricValue: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  metricLabel: { marginTop: 2, fontSize: 13, fontWeight: '700', color: '#64748B' },
  metricSub: { marginTop: 6, fontSize: 11, fontWeight: '700', color: '#94A3B8' },

  panelCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2FF',
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PURPLE,
  },
  taskTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  taskMeta: { marginTop: 2, fontSize: 12, color: '#94A3B8', fontWeight: '600' },

  attentionRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
  attentionCard: {
    width: 128,
    borderRadius: 18,
    padding: 14,
  },
  attentionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attentionCount: { fontSize: 24, fontWeight: '800' },
  attentionBottom: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attentionLabel: { fontSize: 12, fontWeight: '700' },

  leadsCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#EEF2FF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  leadAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  leadName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  leadDest: { marginTop: 2, fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  leadRight: { alignItems: 'flex-end', gap: 6 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  leadMeta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  leadTime: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
});
