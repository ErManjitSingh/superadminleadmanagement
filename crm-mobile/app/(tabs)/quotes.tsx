import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingView } from '@/src/components/LoadingView';
import { colors, radius, shadows, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import {
  getQuotationPackageName,
  getQuotationTotal,
  listMyQuotations,
  type Quotation,
} from '@/src/services/quotations';
import type { UserRole } from '@/src/types';

function getStatusMeta(status?: string) {
  const key = (status || 'draft').toLowerCase();
  if (key.includes('approv')) return { color: colors.success, label: 'Approved', icon: 'checkmark-circle' as const };
  if (key.includes('reject')) return { color: colors.danger, label: 'Rejected', icon: 'close-circle' as const };
  if (key.includes('negot') || key.includes('pending'))
    return { color: colors.warning, label: key.includes('negot') ? 'Negotiation' : 'Pending', icon: 'time' as const };
  if (key.includes('sent')) return { color: colors.info, label: 'Sent', icon: 'send' as const };
  return { color: colors.primary, label: 'Draft', icon: 'document-text' as const };
}

function formatAmount(total: number) {
  if (!total) return '—';
  if (total >= 100000) return `₹${(total / 100000).toFixed(total % 100000 === 0 ? 0 : 1)}L`;
  return `₹${total.toLocaleString('en-IN')}`;
}

type QuoteFilter = 'all' | 'sent' | 'draft';

const FILTERS: { id: QuoteFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Quotation Sent' },
  { id: 'draft', label: 'Drafts' },
];

export default function QuotesScreen() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const [filter, setFilter] = useState<QuoteFilter>('all');

  const query = useInfiniteQuery({
    queryKey: ['quotations', role, filter],
    queryFn: ({ pageParam = 1 }) =>
      listMyQuotations(role!, {
        page: pageParam,
        limit: 20,
        sentOnly: filter === 'sent',
        status: filter === 'draft' ? 'draft' : undefined,
      }),
    enabled: !!role,
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
  });

  if (!role) return <LoadingView />;
  if (query.isLoading) return <LoadingView />;

  const items = query.data?.pages.flatMap((p) => p.items) || [];
  const totalCount = query.data?.pages[0]?.total ?? items.length;

  const openBuilder = (opts?: { leadId?: string; quoteId?: string }) => {
    router.push({
      pathname: '/quotation/builder',
      params: {
        ...(opts?.leadId ? { leadId: opts.leadId } : {}),
        ...(opts?.quoteId ? { quoteId: opts.quoteId } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={['#1E1B4B', colors.primary, '#6D28D9']} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>Sales</Text>
            <Text style={styles.heroTitle}>Quotations</Text>
            <Text style={styles.heroSub}>
              {totalCount} quote{totalCount === 1 ? '' : 's'}
              {filter === 'sent' ? ' sent · edit and send again' : ' · tap to edit'}
            </Text>
          </View>
          <Pressable
            onPress={() => openBuilder()}
            style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.createText}>New</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.filters}>
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setFilter(item.id)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.list, !items.length && styles.listEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => query.hasNextPage && query.fetchNextPage()}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title={filter === 'sent' ? 'No sent quotations' : filter === 'draft' ? 'No drafts' : 'No quotations yet'}
            subtitle={
              filter === 'sent'
                ? 'Jab quotation customer ko send hogi, yahan se edit karke dubara bhej sakte ho.'
                : 'Create a package quote for a lead — itinerary, hotels, transport & pricing.'
            }
          />
        }
        renderItem={({ item }) => (
          <QuoteCard
            item={item}
            onPress={() => {
              const leadId =
                typeof item.lead === 'object'
                  ? item.lead?._id
                  : typeof item.lead === 'string'
                    ? item.lead
                    : undefined;
              openBuilder({ leadId, quoteId: item._id });
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

function QuoteCard({ item, onPress }: { item: Quotation; onPress: () => void }) {
  const total = getQuotationTotal(item);
  const status = getStatusMeta(item.status);
  const leadName =
    typeof item.lead === 'object' && item.lead?.name ? item.lead.name : null;
  const destination =
    item.packageInfo?.destination ||
    item.packageSnapshot?.destination ||
    (typeof item.package === 'object' ? item.package?.destination : null);
  const duration = item.packageInfo?.duration || item.packageSnapshot?.duration;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, shadows.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={[styles.statusAccent, { backgroundColor: status.color }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.quoteIcon}>
            <Ionicons name="document-text" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quoteNo} numberOfLines={1}>
              {item.quoteNumber || 'Draft quotation'}
            </Text>
            <Text style={styles.pkg} numberOfLines={1}>
              {getQuotationPackageName(item)}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${status.color}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {leadName ? (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {leadName}
              </Text>
            </View>
          ) : null}
          {destination ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {destination}
              </Text>
            </View>
          ) : null}
          {duration ? (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{duration}D</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.amount}>{formatAmount(total)}</Text>
          <View style={styles.cardRight}>
            <Text style={styles.date}>
              {(item.sentAt || item.createdAt)
                ? format(parseISO(item.sentAt || item.createdAt || ''), 'dd MMM yyyy')
                : ''}
            </Text>
            {status.label === 'Sent' ? (
              <View style={styles.editPill}>
                <Ionicons name="create-outline" size={13} color={colors.primary} />
                <Text style={styles.editPillText}>Edit & send again</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroSub: { marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.full,
  },
  createText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  filterTextActive: { color: '#fff' },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  editPillText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  list: { padding: spacing.lg, paddingBottom: 48, marginTop: -8 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  statusAccent: { width: 4 },
  cardBody: { flex: 1, padding: spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  quoteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteNo: { fontSize: 15, fontWeight: '800', color: colors.text },
  pkg: { marginTop: 2, fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '48%' },
  metaText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  cardBottom: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: { fontSize: 18, fontWeight: '800', color: colors.primary },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});
