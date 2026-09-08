import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
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
import { getQuoteEditorPath } from '@/src/constants/crmMenu';
import { useAuth } from '@/src/context/AuthContext';
import {
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

  const query = useInfiniteQuery({
    queryKey: ['quotations', role],
    queryFn: ({ pageParam = 1 }) => listMyQuotations(role!, { page: pageParam, limit: 20 }),
    enabled: !!role,
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
  });

  if (!role) return <LoadingView />;
  if (query.isLoading) return <LoadingView />;

  const items = query.data?.pages.flatMap((p) => p.items) || [];

  const openBuilder = (opts?: { leadId?: string; quoteId?: string }) => {
    router.push({
      pathname: '/crm-web',
      params: {
        path: getQuoteEditorPath(role, opts),
        title: 'Quotation Builder',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Quotations</Text>
          <Text style={styles.sub}>Same builder & PDF as website</Text>
        </View>
        <Pressable onPress={() => openBuilder()} style={styles.primaryBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.primaryText}>Create Quote</Text>
        </Pressable>
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
            subtitle="Create using the full website quotation builder (same PDF)."
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
  const status = (item.status || 'draft').replace(/_/g, ' ');
  return (
    <Pressable style={styles.card} onPress={onPress}>
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
        <Ionicons name="globe-outline" size={14} color={PURPLE} />
        <Text style={styles.viewText}>Open website builder / PDF</Text>
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
});
