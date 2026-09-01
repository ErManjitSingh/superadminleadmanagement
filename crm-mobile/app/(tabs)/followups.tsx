import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { FilterChips } from '@/src/components/KpiCard';
import { FollowUpCard } from '@/src/components/FollowUpCard';
import { LoadingView } from '@/src/components/LoadingView';
import { colors, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { fetchFollowUps, updateFollowUp } from '@/src/services/followups';
import type { UserRole } from '@/src/types';

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Done' },
] as const;

type FollowUpTab = (typeof TABS)[number]['key'];

export default function FollowUpsScreen() {
  const { user } = useAuth();
  const role = user!.role as UserRole;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FollowUpTab>('today');

  const query = useInfiniteQuery({
    queryKey: ['followups', role, tab],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchFollowUps(role, { page: pageParam, limit: 25, tab }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.items.length >= (lastPage.limit || 25) ? pages.length + 1 : undefined,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => updateFollowUp(role, id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => Alert.alert('Error', String(error)),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  if (query.isLoading && !query.data) return <LoadingView />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FilterChips options={[...TABS]} value={tab} onChange={setTab} />

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <FollowUpCard
            item={item}
            onPress={
              item.status !== 'completed'
                ? () => {
                    Alert.alert('Mark complete?', 'This follow-up will be marked as done.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Complete',
                        onPress: () => completeMutation.mutate(item._id),
                      },
                    ]);
                  }
                : undefined
            }
          />
        )}
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
            title="No follow-ups"
            subtitle="Follow-ups for this tab will appear here"
            icon="calendar-outline"
          />
        }
        contentContainerStyle={items.length ? styles.list : styles.listEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  listEmpty: { flexGrow: 1 },
});
