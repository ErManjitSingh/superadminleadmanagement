import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { FilterChips } from '@/src/components/KpiCard';
import { LeadCard } from '@/src/components/LeadCard';
import { LoadingView } from '@/src/components/LoadingView';
import { LEAD_FILTERS } from '@/src/constants/leadStatus';
import { colors, radius, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { fetchLeads } from '@/src/services/leads';
import type { LeadFilterKey, UserRole } from '@/src/types';

export default function LeadsScreen() {
  const { user } = useAuth();
  const role = user!.role as UserRole;
  const [filter, setFilter] = useState<LeadFilterKey>('all');
  const [search, setSearch] = useState('');

  const query = useInfiniteQuery({
    queryKey: ['leads', role, filter, search],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchLeads(role, { page: pageParam, limit: 20, filter, search: search.trim() || undefined }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.items.length >= (lastPage.limit || 20) ? pages.length + 1 : undefined,
  });

  const leads = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  if (query.isLoading && !query.data) return <LoadingView />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search leads by name, phone..."
          placeholderTextColor={colors.textMuted}
          style={styles.search}
        />
      </View>

      <FilterChips
        options={LEAD_FILTERS as unknown as Array<{ key: LeadFilterKey; label: string }>}
        value={filter}
        onChange={setFilter}
      />

      <FlatList
        data={leads}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <LeadCard lead={item} />}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.primary}
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
  safe: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  list: { paddingBottom: spacing.xxl },
  listEmpty: { flexGrow: 1 },
});
